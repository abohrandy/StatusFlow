import { Job } from 'bullmq';
import { BaileysManager } from '@statusflow/baileys-engine';
import {
  getStatusPostForWorker,
  markStatusPostCompleted,
  markStatusPostFailed,
  markStatusPostProcessing,
  recordQueueLog,
} from './statusPostRepository';

export interface PublishJobData {
  postId: string;
}

/**
 * Publishes one scheduled status post. Real WhatsApp delivery isn't wired up yet — the
 * pairing/connection layer in @statusflow/baileys-engine is still a mock (see
 * BaileysManager's doc comments) — so the actual "send" step here is simulated. Every
 * surrounding piece is real: DB status transitions, per-attempt logging, and only
 * marking a post permanently FAILED once BullMQ's retries are exhausted.
 */
export class WorkerProcessor {
  public async processJob(job: Job<PublishJobData>): Promise<void> {
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;
    const post = await getStatusPostForWorker(job.data.postId);

    if (!post) {
      await recordQueueLog(job.data.postId, attemptNumber, 'Post no longer exists (likely cancelled) — skipping.');
      return;
    }

    await markStatusPostProcessing(post.id);
    await recordQueueLog(post.id, attemptNumber, `Attempt ${attemptNumber}/${maxAttempts}: publishing ${post.media_type} status.`);

    if (post.whatsapp_status !== 'CONNECTED') {
      // Not a transient failure — retrying won't reconnect the session on its own, so
      // fail permanently now instead of burning the job's remaining retry attempts.
      const reason = 'WhatsApp session is not connected.';
      await markStatusPostFailed(post.id, reason);
      await recordQueueLog(post.id, attemptNumber, `Permanently failed: ${reason}`);
      return;
    }

    try {
      const baileys = new BaileysManager(post.session_id ?? post.id);
      baileys.simulateConnectionSuccess();
      await markStatusPostCompleted(post.id);
      await recordQueueLog(post.id, attemptNumber, 'Published successfully.');
    } catch (err: any) {
      const message = err?.message ?? 'Unknown publish error.';
      await recordQueueLog(post.id, attemptNumber, `Attempt failed: ${message}`);
      if (attemptNumber >= maxAttempts) {
        await markStatusPostFailed(post.id, message);
      } else {
        throw err; // let BullMQ retry with its configured backoff
      }
    }
  }
}
