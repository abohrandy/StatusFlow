import { EventEmitter } from 'events';
import type { Redis } from 'ioredis';
import { Boom } from '@hapi/boom';
import { makeWASocket, DisconnectReason, type WASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import { useRedisAuthState } from './redisAuthState';

export type ConnectionStatus = 'connecting' | 'open' | 'close';

export interface SendStatusInput {
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  caption?: string | null;
  mediaUrl?: string | null;
}

const logger = pino({ level: process.env.BAILEYS_LOG_LEVEL || 'warn' });

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
  private status: ConnectionStatus = 'connecting';

  constructor(private sessionId: string, private redis: Redis) {
    super();
  }

  private async ensureSocket(): Promise<WASocket> {
    if (this.sock) return this.sock;

    const { state, saveCreds } = await useRedisAuthState(this.sessionId, this.redis);
    const sock = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
      if (update.qr) {
        this.emit('qr', update.qr);
      }
      if (update.connection) {
        this.status = update.connection;
        this.emit('status', this.status);
      }
      if (update.connection === 'close') {
        const statusCode = (update.lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
        this.emit('close', { statusCode, loggedOut: statusCode === DisconnectReason.loggedOut });
      }
    });

    this.sock = sock;
    return sock;
  }

  /** Starts the connection and requests a real WhatsApp pairing code for `phoneNumber`. */
  async requestPairingCode(phoneNumber: string): Promise<string> {
    const sock = await this.ensureSocket();
    // Baileys needs a moment to complete the initial WebSocket handshake before
    // requestPairingCode is called. Calling it immediately can close the socket
    // and surface the unhelpful "Connection Closed" error from WhatsApp.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return sock.requestPairingCode(phoneNumber);
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
    const sock = await this.ensureSocket();
    const opened = await this.waitUntilOpen();
    if (!opened) {
      throw new Error('WhatsApp connection did not open in time.');
    }

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
    this.sock?.end(undefined);
    this.sock = null;
  }
}
