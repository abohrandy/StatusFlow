import type { Redis } from 'ioredis';

function contactsKey(sessionId: string): string {
  return `baileys:${sessionId}:statusJidList`;
}

const INDIVIDUAL_JID_SUFFIXES = ['@s.whatsapp.net', '@lid'];

function isIndividualJid(jid: string | null | undefined): jid is string {
  return !!jid && INDIVIDUAL_JID_SUFFIXES.some((suffix) => jid.endsWith(suffix));
}

/**
 * Merges newly-seen contact JIDs into the session's persisted status audience. WhatsApp
 * status updates are end-to-end encrypted individually per recipient — unlike a group
 * chat, the server doesn't fan them out on its own, so Baileys needs the explicit JID
 * list (`statusJidList`) up front or the message is accepted (no error) but delivered to
 * no one. Baileys only learns a session's contacts from `messaging-history.set` (the
 * initial sync right after connecting) and `contacts.upsert`/`contacts.update`
 * (incrementally after that) — this persists what it has seen so far in Redis, since the
 * worker process sending the status later is a different process than whichever one
 * received these events.
 */
export async function addContactJids(sessionId: string, redis: Redis, jids: (string | null | undefined)[]): Promise<void> {
  const valid = jids.filter(isIndividualJid);
  if (valid.length === 0) return;
  await redis.sadd(contactsKey(sessionId), ...valid);
}

/** The full set of this session's known contact JIDs — the audience a status broadcast reaches. */
export async function getContactJids(sessionId: string, redis: Redis): Promise<string[]> {
  return redis.smembers(contactsKey(sessionId));
}

export async function clearContactJids(sessionId: string, redis: Redis): Promise<void> {
  await redis.del(contactsKey(sessionId));
}
