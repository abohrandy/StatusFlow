import { Job } from 'bullmq';
import { WhatsAppConnection } from '@statusflow/baileys-engine';
import { redisConnection } from './redis';
import {
  getStatusPostForWorker,
  markSessionLoggedOut,
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
  // The worker runs up to 5 jobs concurrently (see queue.ts). Two due posts on the same
  // WhatsApp session would otherwise open two simultaneous Baileys sockets authenticated
  // with the same registered device credentials — WhatsApp treats the newer connection as
  // a replacement and drops the older one mid-send. Serializing per session_id keeps
  // different users' sessions running in parallel while one session's posts still go out
  // one at a time.
  private sessionLocks = new Map<string, Promise<void>>();

  private runSerialized<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.sessionLocks.get(sessionId) ?? Promise.resolve();
    const run = previous.then(task, task);
    this.sessionLocks.set(sessionId, run.then(() => undefined, () => undefined));
    return run;
  }

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

    await this.runSerialized(post.session_id!, async () => {
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
        if (connection.isLoggedOut()) {
          // Not a transient failure — retrying just burns the remaining attempts against a
          // session WhatsApp has already killed. Fail permanently now and reflect the real
          // session state so later posts short-circuit on the CONNECTED check instead of
          // repeating this same doomed connection attempt.
          await markSessionLoggedOut(post.session_id!);
          await markStatusPostFailed(post.id, message);
        } else if (attemptNumber >= maxAttempts) {
          await markStatusPostFailed(post.id, message);
        } else {
          throw err; // let BullMQ retry with its configured backoff
        }
      } finally {
        await connection.close();
      }
    });
  }
}
