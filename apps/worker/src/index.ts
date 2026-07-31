import { WorkerProcessor } from './WorkerProcessor';
import { sweepExpiredSubscriptions } from './billingSweep';

console.log('[StatusFlow Worker Engine] BullMQ & Redis Worker Daemon Booting...');

const processor = new WorkerProcessor();

// Simulated poll loop
setInterval(async () => {
  console.log('[StatusFlow Worker] Listening for delayed BullMQ queue jobs...');
}, 15000);

// Billing safety net: see billingSweep.ts for why this exists alongside webhook-driven
// expiration. Hourly is plenty — this only catches subscriptions the webhook missed.
setInterval(() => {
  sweepExpiredSubscriptions().catch((err) => {
    console.error('[Worker] Billing sweep failed:', err.message);
  });
}, 60 * 60 * 1000);
