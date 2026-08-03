import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { WorkerProcessor } from './WorkerProcessor';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const processor = new WorkerProcessor();

export const statusPostWorker = new Worker('status-posts', (job) => processor.processJob(job), {
  connection,
  concurrency: 5,
});

statusPostWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

statusPostWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});
