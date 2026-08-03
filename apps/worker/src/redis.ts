import IORedis from 'ioredis';

/** Shared between BullMQ (queue.ts) and WhatsAppConnection (WorkerProcessor.ts) — a single connection, not one per use. */
export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
