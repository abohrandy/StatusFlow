import { EventEmitter } from 'events';
import type { Redis } from 'ioredis';
import { Boom } from '@hapi/boom';
import { fetchLatestBaileysVersion, makeWASocket, DisconnectReason, type WASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import { useRedisAuthState } from './redisAuthState';
import { addContactJids, getContactJids } from './contactsStore';

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
 * NOTE: a status broadcast is only visible to the JIDs passed as `statusJidList` (see
 * contactsStore.ts) — `sendMessage('status@broadcast', ..., { broadcast: true })` alone
 * resolves successfully but reaches nobody, since WhatsApp's server doesn't fan a status
 * out on its own the way it does a group message.
 */
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_DELAY_MS = 60_000;

export class WhatsAppConnection extends EventEmitter {
  private sock: WASocket | null = null;
  private connectingSocket: Promise<WASocket> | null = null;
  private status: ConnectionStatus = 'connecting';
  private qrReady = false;
  private closingIntentionally = false;
  private loggedOut = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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
        // Baileys' default (60s) was observed in production timing out its own post-connect
        // handshake (executeInitQueries -> fetchProps -> query -> waitForMessage, per the
        // worker's logs: "unexpected error in 'init queries' ... Timed Out") on every retry
        // attempt, at exactly the 60s mark each time — not a throttling pattern that would
        // improve on later, more-spaced-out attempts, but a step that consistently needs
        // more room than the default gives it.
        defaultQueryTimeoutMs: 120_000,
        // Defaults to true. On 'open', Baileys fires off fetchProps/fetchBlocklist/
        // fetchPrivacySettings to mirror what the real WhatsApp Web client requests for
        // display purposes — this app never renders any of that, it only ever sends status
        // broadcasts. fetchProps was observed hanging for the full defaultQueryTimeoutMs
        // and logging "unexpected error in 'init queries'"; disabling this is a real, if
        // minor, fix on its own (nothing here consumes their result, so there's no reason
        // to pay that cost or risk that noise). NOTE: this did NOT resolve the deeper
        // sendStatus() timeout also under investigation — that one reproduces even with
        // this disabled, isolated from any other connection, so it's coming from somewhere
        // else in the send path (likely prekey/session setup for the recipients in
        // statusJidList) and needs separate investigation.
        fireInitQueries: false,
        // Defaults to false. It's read only during device *registration* (see
        // @whiskeysockets/baileys/lib/Utils/validate-connection.js's generateRegistrationNode,
        // which sets the companion payload's requireFullSync from exactly this flag) — an
        // ordinary reconnect to an already-registered device never touches it. Left at the
        // default, a fresh pairing can end up with a lighter/partial initial sync instead of
        // the account's real full contact list, and no later reconnect ever asks for more.
        syncFullHistory: true,
      });

      // Baileys fires this listener without awaiting it — an unhandled rejection here
      // (e.g. SESSION_ENCRYPTION_KEY missing or malformed, see sessionEncryption.ts) would
      // otherwise crash the whole process by default in current Node, taking down every
      // unrelated feature over one WhatsApp session's misconfiguration.
      sock.ev.on('creds.update', () => {
        saveCreds().catch((err) => {
          console.error(`[WhatsApp:${this.sessionId}] Failed to persist session credentials:`, err instanceof Error ? err.message : err);
        });
      });
      // The contact list a status broadcast can actually reach (see contactsStore.ts) —
      // 'messaging-history.set' delivers the initial batch right after connecting,
      // 'contacts.upsert'/'contacts.update' cover anything added or changed after that.
      // `void`ing a promise only suppresses the "unused promise" lint warning — it does NOT
      // attach a .catch(), so a rejection here (e.g. a transient Redis error) would otherwise
      // be an unhandled rejection, which crashes the whole process by default in current Node.
      const onContactsSeen = (contacts: Array<{ id?: string }>) => {
        addContactJids(this.sessionId, this.redis, contacts.map((c) => c.id)).catch((err) => {
          console.error(`[WhatsApp:${this.sessionId}] Failed to persist synced contacts:`, err instanceof Error ? err.message : err);
        });
      };
      sock.ev.on('messaging-history.set', ({ contacts }) => onContactsSeen(contacts));
      sock.ev.on('contacts.upsert', onContactsSeen);
      sock.ev.on('contacts.update', onContactsSeen);
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
            if (loggedOut) this.loggedOut = true;
            this.status = 'close';
            this.emit('status', this.status);
            this.emit('close', { statusCode, loggedOut });
            return;
          }
          this.reconnectAttempts += 1;
          if (this.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            // This used to reconnect instantly and unconditionally forever — a connection
            // that keeps failing for any non-loggedOut reason (a stuck network path, a
            // WhatsApp-side issue) would hot-loop indefinitely in the background, invisible
            // to whoever's awaiting this connection (they've long since timed out on their
            // own, e.g. waitUntilOpen's caller-specified timeout). Give up and surface it
            // as terminal instead.
            this.status = 'close';
            this.emit('status', this.status);
            this.emit('close', { statusCode, loggedOut, reconnectAttemptsExhausted: true });
            return;
          }
          // Exponential backoff, capped, with jitter so multiple sessions whose sockets
          // close around the same moment (e.g. a shared network blip) don't all retry in
          // lockstep.
          const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** (this.reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS);
          const jitter = Math.random() * delay * 0.2;
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            // Same unhandled-rejection risk as the contacts listeners above — ensureSocket()
            // can throw before ever creating a socket (e.g. a decrypt failure reading the
            // persisted creds), which would otherwise never emit a 'close' to retry from.
            this.ensureSocket().catch((err) => {
              console.error(`[WhatsApp:${this.sessionId}] Reconnect attempt failed:`, err instanceof Error ? err.message : err);
            });
          }, delay + jitter);
          return;
        }
        if (update.connection) {
          this.status = update.connection;
          if (update.connection === 'open') {
            this.reconnectAttempts = 0;
          }
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

  /** True once WhatsApp's server has sent an explicit logout (not just a transient close) —
   * the persisted session is dead and the account needs to go through pairing again. */
  isLoggedOut(): boolean {
    return this.loggedOut;
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

  /** Polls Redis for this session's synced contacts, up to `timeoutMs` — see sendStatus(). */
  private async waitForContacts(timeoutMs = 45_000, pollIntervalMs = 3_000): Promise<string[]> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
      const contactJids = await getContactJids(this.sessionId, this.redis);
      if (contactJids.length > 0 || Date.now() >= deadline) return contactJids;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  /** Publishes a status update. Reuses the persisted session — no new pairing code needed if already connected before. */
  async sendStatus(input: SendStatusInput): Promise<void> {
    // waitUntilOpen()'s own 20s default is tuned for a quick status check (see
    // apps/api/src/routes/whatsapp.ts), not for standing up a brand-new socket from
    // scratch — the worker builds a fresh WhatsAppConnection per send (see
    // WorkerProcessor.ts) and tears it down after, so this always pays the full connect
    // handshake. That handshake was observed timing out at the 60s mark before
    // defaultQueryTimeoutMs was raised to 120s above; giving it the same headroom here
    // means a real send failure looks like one, instead of every attempt failing before
    // the handshake even had a chance to finish.
    const opened = await this.waitUntilOpen(120_000);
    if (!opened) {
      if (this.isLoggedOut()) {
        throw new Error('WhatsApp session was logged out — reconnect WhatsApp to keep posting statuses.');
      }
      throw new Error('WhatsApp connection did not open in time.');
    }
    // Fetch the socket after waiting, not before — a transient close/reconnect while
    // waiting for 'open' (see ensureSocket) would otherwise leave this pointing at the
    // now-dead socket instead of the one that actually reached 'open'.
    const sock = await this.ensureSocket();

    // Unlike a group chat, WhatsApp's server doesn't fan a status broadcast out on its
    // own — Baileys only encrypts it for the JIDs listed in `statusJidList`. Omitting it
    // doesn't error: sendMessage resolves normally, the post gets marked COMPLETED, and
    // the status is delivered to nobody. Failing loudly here beats a silent no-op.
    //
    // A short grace-period poll before giving up: this connection just reached 'open', and
    // 'messaging-history.set' (see contactsStore.ts) can still be a few seconds away even
    // with syncFullHistory on. Worth the wait here specifically — BullMQ's retry backoff
    // already covers a much longer horizon, but there's no reason to burn a whole retry
    // attempt (and its backoff delay) on a sync that was seconds from landing anyway.
    const contactJids = await this.waitForContacts();
    if (contactJids.length === 0) {
      throw new Error(
        'No synced WhatsApp contacts yet, so this status would not be visible to anyone. ' +
          'WhatsApp syncs your contact list shortly after pairing — try again in a minute, ' +
          'or reconnect WhatsApp if this keeps happening.',
      );
    }
    // relayMessage's status/group branch (see @whiskeysockets/baileys/lib/Socket/messages-send.js)
    // builds its device list *only* from statusJidList — unlike a normal 1:1 message, it does
    // NOT automatically include the sender's own other devices. Without this, the status
    // reaches your contacts but never syncs back to your own phone's "My Status" — which is
    // exactly what "completed with zero errors, but nothing shows up when I check" looks like.
    const selfJid = sock.user?.id;
    const statusJidList = selfJid ? [...new Set([...contactJids, selfJid])] : contactJids;
    const sendOpts = { broadcast: true, statusJidList } as const;

    if (input.mediaType === 'TEXT') {
      await sock.sendMessage('status@broadcast', { text: input.caption ?? '' }, sendOpts);
    } else if (input.mediaType === 'IMAGE') {
      if (!input.mediaUrl) throw new Error('mediaUrl is required for an IMAGE status.');
      await sock.sendMessage(
        'status@broadcast',
        { image: { url: input.mediaUrl }, caption: input.caption ?? undefined },
        sendOpts,
      );
    } else {
      if (!input.mediaUrl) throw new Error('mediaUrl is required for a VIDEO status.');
      await sock.sendMessage(
        'status@broadcast',
        { video: { url: input.mediaUrl }, caption: input.caption ?? undefined },
        sendOpts,
      );
    }
  }

  /** Cancels a pending backoff reconnect, if one's scheduled — otherwise it would fire
   * after an intentional close()/logout(), reopening a socket nobody asked for anymore. */
  private cancelScheduledReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** Closes the socket without invalidating the session — safe to call, does not log out. */
  async close(): Promise<void> {
    this.closingIntentionally = true;
    this.cancelScheduledReconnect();
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
    this.cancelScheduledReconnect();
    try {
      await this.sock?.logout();
    } catch {
      // Already logged out, or the socket is dead — nothing more to do.
    } finally {
      this.sock = null;
    }
  }
}
