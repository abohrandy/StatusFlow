import { Job } from 'bullmq';
import { WhatsAppConnection } from '@statusflow/baileys-engine';
import { redisConnection } from './redis';
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
 * Publishes one scheduled status post over a real WhatsApp connection (see
 * @statusflow/baileys-engine's WhatsAppConnection — reuses the session's persisted
 * Redis auth state from pairing, no new pairing code needed). DB status transitions,
 * per-attempt logging, and only marking a post permanently FAILED once BullMQ's retries
 * are exhausted are all real regardless of whether the send itself succeeds.
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

    const connection = new WhatsAppConnection(post.session_id!, redisConnection);
    try {
      await connection.sendStatus({
        mediaType: post.media_type,
        caption: post.caption,
        mediaUrl: post.media_url,
      });
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
    } finally {
      await connection.close();
    }
  }
}
