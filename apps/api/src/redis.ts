import IORedis from 'ioredis';

/** Shared Redis connection for API routes & background jobs. */
export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
