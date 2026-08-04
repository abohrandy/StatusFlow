import { Worker } from 'bullmq';
import { WorkerProcessor } from './WorkerProcessor';
import { redisConnection as connection } from './redis';

const processor = new WorkerProcessor();

// Was hardcoded with no way to tune it per-deployment. Default kept at 5 rather than
// raised blind — more simultaneous WhatsApp connections from this one process could
// worsen the reconnect/rate-limit behavior just hardened elsewhere (WhatsAppConnection.ts),
// and there's no evidence throughput is actually a current bottleneck. Raise via env if it is.
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 5;

export const statusPostWorker = new Worker('status-posts', (job) => processor.processJob(job), {
  connection,
  concurrency: WORKER_CONCURRENCY,
});

statusPostWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

statusPostWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});
