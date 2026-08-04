import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // standard GCM nonce size

function getKey(): Buffer {
  const keyHex = process.env.SESSION_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      'SESSION_ENCRYPTION_KEY is not set — required to encrypt WhatsApp session credentials ' +
        'before they are persisted to Redis. Generate one with `openssl rand -hex 32` and set ' +
        'it on both the API and worker services (same value on both — one encrypts, the other decrypts).',
    );
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('SESSION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes) — generate one with `openssl rand -hex 32`.');
  }
  return key;
}

/** Returns `iv:authTag:ciphertext`, all hex — self-describing so decrypt() doesn't need the IV passed separately. */
export function encryptSessionData(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptSessionData(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Malformed encrypted session payload — expected "iv:authTag:ciphertext".');
  }
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

/** Entries written before this encryption existed are plain JSON (always starts with `{` or `[`) — read them
 * through transparently once rather than breaking every already-paired session. They get rewritten
 * encrypted the next time they're saved (Baileys calls saveCreds/keys.set regularly, e.g. on every reconnect). */
export function isLegacyPlaintext(raw: string): boolean {
  return raw.startsWith('{') || raw.startsWith('[');
}
