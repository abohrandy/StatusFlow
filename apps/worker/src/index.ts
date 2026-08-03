import './queue';
import { sweepExpiredSubscriptions } from './billingSweep';

console.log('[StatusFlow Worker Engine] BullMQ & Redis Worker Daemon Booting...');
console.log('[StatusFlow Worker] Listening on the status-posts queue.');

// Billing safety net: see billingSweep.ts for why this exists alongside webhook-driven
// expiration. Hourly is plenty — this only catches subscriptions the webhook missed.
setInterval(() => {
  sweepExpiredSubscriptions().catch((err) => {
    console.error('[Worker] Billing sweep failed:', err.message);
  });
}, 60 * 60 * 1000);
