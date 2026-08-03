import { Worker } from 'bullmq';
import { WorkerProcessor } from './WorkerProcessor';
import { redisConnection as connection } from './redis';

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
