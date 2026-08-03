import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const STATUS_POST_QUEUE_NAME = 'status-posts';

/**
 * `maxRetriesPerRequest: null` is required by BullMQ — it manages its own retry/backoff
 * semantics on top of the connection and will hang waiting on ioredis's default
 * per-command retry limit otherwise.
 */
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const statusPostQueue = new Queue(STATUS_POST_QUEUE_NAME, { connection });
