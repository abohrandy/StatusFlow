import type { Redis } from 'ioredis';
import { BufferJSON, initAuthCreds, proto, type AuthenticationCreds, type AuthenticationState, type SignalDataTypeMap } from '@whiskeysockets/baileys';

function keyFor(sessionId: string, file: string): string {
  return `baileys:${sessionId}:${file}`;
}

/**
 * Redis-backed mirror of Baileys' own `useMultiFileAuthState` reference implementation
 * (see @whiskeysockets/baileys/lib/Utils/use-multi-file-auth-state.js) — same structure,
 * one Redis key per "file" instead of one file per file. Redis (not the filesystem or
 * Postgres) because apps/api (pairing) and apps/worker (publishing) are separate
 * processes/containers that both already depend on the same Redis instance for BullMQ —
 * a session paired via the API must be resumable by the worker later without any shared
 * disk between them.
 */
export async function useRedisAuthState(
  sessionId: string,
  redis: Redis,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const writeData = async (data: unknown, file: string): Promise<void> => {
    await redis.set(keyFor(sessionId, file), JSON.stringify(data, BufferJSON.replacer));
  };

  const readData = async <T>(file: string): Promise<T | null> => {
    const raw = await redis.get(keyFor(sessionId, file));
    if (!raw) return null;
    return JSON.parse(raw, BufferJSON.reviver) as T;
  };

  const removeData = async (file: string): Promise<void> => {
    await redis.del(keyFor(sessionId, file));
  };

  const creds = (await readData<AuthenticationCreds>('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: Record<string, SignalDataTypeMap[typeof type]> = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData<any>(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              if (value !== null) {
                data[id] = value;
              }
            }),
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            const entries = (data as Record<string, Record<string, unknown> | undefined>)[category];
            for (const id in entries) {
              const value = entries[id];
              const file = `${category}-${id}`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData(creds, 'creds'),
  };
}

/** Clears every persisted key for a session — used when a user disconnects WhatsApp for good. */
export async function clearRedisAuthState(sessionId: string, redis: Redis): Promise<void> {
  const keys = await redis.keys(keyFor(sessionId, '*'));
  if (keys.length) await redis.del(...keys);
}
