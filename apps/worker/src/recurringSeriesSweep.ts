import { Queue } from 'bullmq';
import { redisConnection } from './redis';
import { nextOccurrence, type RecurrenceRule } from './recurrence';
import {
  getActiveSeries,
  getLatestSessionId,
  markSeriesCompleted,
  markSeriesMaterialized,
  materializeOccurrence,
  type SeriesRow,
} from './seriesRepository';

// How far ahead of "now" an occurrence is allowed to be turned into a status_posts row +
// BullMQ job. Materializing everything for a months-long series on day one would create a
// pile of jobs whose media/session could go stale long before they're due — a rolling
// window means each occurrence is only committed to shortly before it actually needs to
// fire, so recent changes (a disconnected WhatsApp session, a cancelled series) are still
// respected right up until the last minute.
const MATERIALIZE_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

// Safety cap on how many occurrences one series can catch up on in a single sweep — guards
// against a runaway loop if a series' interval is misconfigured to something tiny, or the
// worker was down long enough for many occurrences to have come due at once.
const MAX_OCCURRENCES_PER_SWEEP = 50;

// A separate producer from the Worker in queue.ts (that's the consumer) — BullMQ expects
// exactly this: one process can hold both a Queue (to add jobs) and a Worker (to process
// them) for the same queue name.
const producerQueue = new Queue('status-posts', { connection: redisConnection });

function toRule(series: SeriesRow): RecurrenceRule {
  return {
    recurrenceType: series.recurrence_type,
    intervalDays: series.interval_days,
    weekdays: series.weekdays,
    startAt: new Date(series.start_at),
    endAt: new Date(series.end_at),
  };
}

async function sweepOneSeries(series: SeriesRow): Promise<void> {
  const rule = toRule(series);
  let after = series.last_materialized_at ? new Date(series.last_materialized_at) : new Date(rule.startAt.getTime() - 1);

  for (let i = 0; i < MAX_OCCURRENCES_PER_SWEEP; i++) {
    const next = nextOccurrence(rule, after);
    if (!next) {
      await markSeriesCompleted(series.id);
      return;
    }
    if (next.getTime() - Date.now() > MATERIALIZE_LOOKAHEAD_MS) {
      return; // Not due yet — pick up again on a later sweep.
    }

    const sessionId = await getLatestSessionId(series.user_id);
    const postId = await materializeOccurrence(series, next, sessionId);
    await producerQueue.add(
      'publish',
      { postId },
      {
        jobId: postId,
        delay: Math.max(0, next.getTime() - Date.now()),
        // See posts.ts's matching comment — more attempts to land on a clean connection,
        // not masking a permanent failure (production logs show intermittent, not constant,
        // handshake timeouts).
        attempts: 5,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    );
    await markSeriesMaterialized(series.id, next);
    after = next;
  }
}

/** Advances every active recurring series by whatever occurrences are now due, and marks
 * a series COMPLETED once it's run past its end date with nothing left to materialize. */
export async function sweepRecurringSeries(): Promise<void> {
  const seriesList = await getActiveSeries();
  for (const series of seriesList) {
    await sweepOneSeries(series);
  }
}
