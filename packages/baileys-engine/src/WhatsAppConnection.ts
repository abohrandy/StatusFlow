import { EventEmitter } from 'events';
import type { Redis } from 'ioredis';
import { Boom } from '@hapi/boom';
import { fetchLatestBaileysVersion, makeWASocket, DisconnectReason, type WASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import { useRedisAuthState } from './redisAuthState';

export type ConnectionStatus = 'connecting' | 'open' | 'close';

export interface SendStatusInput {
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  caption?: string | null;
  mediaUrl?: string | null;
}

const logger = pino({ level: process.env.BAILEYS_LOG_LEVEL || 'warn' });

// A pairing-code user is racing WhatsApp's own short-lived code expiry the moment they tap
// "Request Code" — every millisecond spent before the code is even generated eats into that
// window. Re-fetching WhatsApp's current protocol version over the network on every single
// connection attempt was pure latency for no benefit (it rarely changes); cache it for an
// hour so only the first connection in a while pays that cost.
let cachedVersion: { version: [number, number, number]; fetchedAt: number } | null = null;
const VERSION_CACHE_TTL_MS = 60 * 60 * 1000;

async function getBaileysVersion(): Promise<[number, number, number]> {
  if (cachedVersion && Date.now() - cachedVersion.fetchedAt < VERSION_CACHE_TTL_MS) {
    return cachedVersion.version;
  }
  const { version } = await fetchLatestBaileysVersion({ timeout: 5_000 });
  cachedVersion = { version, fetchedAt: Date.now() };
  return version;
}

/**
 * Wraps one WhatsApp multi-device connection (one `whatsapp_sessions` row). Real
 * `@whiskeysockets/baileys` underneath — see redisAuthState.ts for why auth state lives
 * in Redis instead of the filesystem.
 *
 * NOTE: WhatsApp's actual status-broadcast wire behavior (visibility to contacts,
 * exact accepted media formats) can only be confirmed by pairing a real phone number
 * and watching it land on that phone's Status tab — this class follows Baileys'
 * documented `sendMessage('status@broadcast', ..., { broadcast: true })` contract, but
 * has not been exercised against a live WhatsApp account.
 */
export class WhatsAppConnection extends EventEmitter {
  private sock: WASocket | null = null;
  private connectingSocket: Promise<WASocket> | null = null;
  private status: ConnectionStatus = 'connecting';
  private qrReady = false;
  private closingIntentionally = false;

  constructor(private sessionId: string, private redis: Redis) {
    super();
  }

  private async ensureSocket(): Promise<WASocket> {
    if (this.sock) return this.sock;
    if (this.connectingSocket) return this.connectingSocket;

    this.closingIntentionally = false;
    this.connectingSocket = (async () => {
      const { state, saveCreds } = await useRedisAuthState(this.sessionId, this.redis);
      // The WhatsApp Web protocol version baked into the installed @whiskeysockets/baileys
      // package goes stale fast — WhatsApp's servers silently stop responding to outdated
      // versions (no error, the socket just never reaches 'open' or emits a QR), which is
      // indistinguishable from a network failure. Fetching the current version keeps new
      // connections working without needing to bump the dependency; falls back to the
      // bundled version (previous behavior) if the fetch itself fails. Cached (see
      // getBaileysVersion above) so this costs a network round-trip only once an hour.
      const version = await getBaileysVersion();
      const sock = makeWASocket({
        auth: state,
        logger,
        version,
        printQRInTerminal: false,
        // Baileys rotates its internal QR refs on this interval regardless of whether the
        // caller is doing QR or pairing-code auth (the server always sends both), and once
        // the small fixed batch of refs is exhausted it force-closes the socket with
        // `timedOut` ("QR refs attempts ended") — the default (60s then 20s per rotation)
        // exhausts in roughly 2-3 minutes. A phone-pairing-code user has to open WhatsApp,
        // find Linked Devices, and type 8 characters — routinely longer than that — so the
        // connection was closing (and getting silently reconnected onto a brand-new session
        // by the close handler below) while the code was still being typed in, which
        // invalidates it: WhatsApp then rejects it with "couldn't link device". A much
        // longer window means the socket survives for as long as pairing realistically takes.
        qrTimeout: 5 * 60_000,
      });

      sock.ev.on('creds.update', saveCreds);
      sock.ev.on('connection.update', (update) => {
        if (update.qr) {
          this.qrReady = true;
          this.emit('qr', update.qr);
        }
        if (update.connection === 'close') {
          this.sock = null;
          const statusCode = (update.lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;
          // WhatsApp always closes the socket once — with a non-loggedOut reason such
          // as `restartRequired` — right after a pairing code/QR is confirmed on the
          // phone, to force a reconnect on the now-registered credentials. Treating
          // that as a terminal failure (instead of transparently reconnecting) means
          // pairing could never complete, so only surface `close` as terminal when the
          // session was actually logged out or we closed it ourselves.
          if (loggedOut || this.closingIntentionally) {
            this.status = 'close';
            this.emit('status', this.status);
            this.emit('close', { statusCode, loggedOut });
          } else {
            void this.ensureSocket();
          }
          return;
        }
        if (update.connection) {
          this.status = update.connection;
          this.emit('status', this.status);
        }
      });

      this.sock = sock;
      return sock;
    })();

    try {
      return await this.connectingSocket;
    } finally {
      this.connectingSocket = null;
    }
  }

  /** Starts the connection and requests a real WhatsApp pairing code for `phoneNumber`. */
  async requestPairingCode(phoneNumber: string): Promise<string> {
    await this.ensureSocket();
    // Baileys only accepts a pairing request after it has emitted its initial
    // QR/readiness event. Waiting for that signal avoids generating codes that
    // WhatsApp immediately rejects as stale or invalid.
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { cleanup(); reject(new Error('Timed out waiting for WhatsApp socket.')); }, 10_000);
      if (this.qrReady) { clearTimeout(timeout); return resolve(); }
      const onQr = () => { cleanup(); resolve(); };
      const cleanup = () => { clearTimeout(timeout); this.off('qr', onQr); this.off('close', onClose); };
      const onClose = () => { cleanup(); reject(new Error('Connection Closed')); };
      this.on('qr', onQr);
      this.on('close', onClose);
    });
    // Re-fetch rather than reuse the socket captured above — a transient close/reconnect
    // during the wait (see the connection.update handler in ensureSocket) would otherwise
    // leave us calling requestPairingCode on an already-dead socket.
    const sock = await this.ensureSocket();
    return sock.requestPairingCode(phoneNumber);
  }

  async requestQrCode(timeoutMs = 30_000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { cleanup(); reject(new Error('Timed out waiting for WhatsApp QR code.')); }, timeoutMs);
      const onQr = (qr: string) => { cleanup(); resolve(qr); };
      const onClose = () => { cleanup(); reject(new Error('Connection Closed')); };
      const cleanup = () => {
        clearTimeout(timeout);
        this.off('qr', onQr);
        this.off('close', onClose);
      };
      this.on('qr', onQr);
      this.on('close', onClose);
      void this.ensureSocket().catch((err) => { cleanup(); reject(err); });
    });
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  /** Resolves true once the socket reaches 'open', false if it closes or times out first. */
  async waitUntilOpen(timeoutMs = 20_000): Promise<boolean> {
    await this.ensureSocket();
    if (this.status === 'open') return true;

    return new Promise((resolve) => {
      const cleanup = () => {
        clearTimeout(timeout);
        this.off('status', onStatus);
      };
      const onStatus = (status: ConnectionStatus) => {
        if (status === 'open') {
          cleanup();
          resolve(true);
        } else if (status === 'close') {
          cleanup();
          resolve(false);
        }
      };
      const timeout = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
      this.on('status', onStatus);
    });
  }

  /** Publishes a status update. Reuses the persisted session — no new pairing code needed if already connected before. */
  async sendStatus(input: SendStatusInput): Promise<void> {
    const opened = await this.waitUntilOpen();
    if (!opened) {
      throw new Error('WhatsApp connection did not open in time.');
    }
    // Fetch the socket after waiting, not before — a transient close/reconnect while
    // waiting for 'open' (see ensureSocket) would otherwise leave this pointing at the
    // now-dead socket instead of the one that actually reached 'open'.
    const sock = await this.ensureSocket();

    if (input.mediaType === 'TEXT') {
      await sock.sendMessage('status@broadcast', { text: input.caption ?? '' }, { broadcast: true });
    } else if (input.mediaType === 'IMAGE') {
      if (!input.mediaUrl) throw new Error('mediaUrl is required for an IMAGE status.');
      await sock.sendMessage(
        'status@broadcast',
        { image: { url: input.mediaUrl }, caption: input.caption ?? undefined },
        { broadcast: true },
      );
    } else {
      if (!input.mediaUrl) throw new Error('mediaUrl is required for a VIDEO status.');
      await sock.sendMessage(
        'status@broadcast',
        { video: { url: input.mediaUrl }, caption: input.caption ?? undefined },
        { broadcast: true },
      );
    }
  }

  /** Closes the socket without invalidating the session — safe to call, does not log out. */
  async close(): Promise<void> {
    this.closingIntentionally = true;
    this.sock?.end(undefined);
    this.sock = null;
  }

  /**
   * Unlinks the device from WhatsApp for good — use for a user-initiated "Disconnect", not
   * the worker's between-sends teardown (see close()). Best-effort: if there's no live
   * socket to send the logout IQ over, this just clears local state; the caller is still
   * responsible for deleting this session's persisted Redis auth state so a stale device
   * doesn't silently remain reachable with the old credentials.
   */
  async logout(): Promise<void> {
    this.closingIntentionally = true;
    try {
      await this.sock?.logout();
    } catch {
      // Already logged out, or the socket is dead — nothing more to do.
    } finally {
      this.sock = null;
    }
  }
}
