import './queue';
import { sweepExpiredSubscriptions } from './billingSweep';
import { sweepRecurringSeries } from './recurringSeriesSweep';
import { sweepStalledStatusPosts } from './postSweep';

console.log('[StatusFlow Worker Engine] BullMQ & Redis Worker Daemon Booting...');
console.log('[StatusFlow Worker] Listening on the status-posts queue.');

// Billing safety net: see billingSweep.ts for why this exists alongside webhook-driven
// expiration. Hourly is plenty — this only catches subscriptions the webhook missed.
setInterval(() => {
  sweepExpiredSubscriptions().catch((err) => {
    console.error('[Worker] Billing sweep failed:', err.message);
  });
}, 60 * 60 * 1000);

// Materializes due occurrences of recurring status post series (see recurringSeriesSweep.ts).
// Runs far more often than the billing sweep since it's what actually keeps a recurring
// series' next post enqueued in time — every 10 minutes comfortably beats the 24h
// materialization lookahead window with room to spare if a sweep is ever briefly missed.
setInterval(() => {
  sweepRecurringSeries().catch((err) => {
    console.error('[Worker] Recurring series sweep failed:', err.message);
  });
}, 10 * 60 * 1000);
void sweepRecurringSeries().catch((err) => {
  console.error('[Worker] Recurring series sweep failed:', err.message);
});

// Orphaned-job safety net: see postSweep.ts. Runs more often than the billing sweep since a
// stuck post is directly user-visible on the dashboard, unlike a lapsed subscription.
setInterval(() => {
  sweepStalledStatusPosts().catch((err) => {
    console.error('[Worker] Post sweep failed:', err.message);
  });
}, 5 * 60 * 1000);
