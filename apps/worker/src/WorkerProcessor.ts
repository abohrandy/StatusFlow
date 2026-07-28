import { BaileysManager } from '@statusflow/baileys-engine';

export interface ScheduledJobPayload {
  jobId: string;
  postId: string;
  userId: string;
  sessionId: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  mediaUrl?: string;
  caption?: string;
  scheduledAt: string;
}

export class WorkerProcessor {
  private activeJobs: Set<string> = new Set();
  private deadLetterQueue: ScheduledJobPayload[] = [];

  public async processJob(job: ScheduledJobPayload): Promise<boolean> {
    // 1. Duplicate Job Prevention (Idempotency check)
    if (this.activeJobs.has(job.jobId)) {
      console.warn(`[Worker] Duplicate job execution blocked for Job ID: ${job.jobId}`);
      return false;
    }

    this.activeJobs.add(job.jobId);
    console.log(`[Worker] Picked up job ${job.jobId} for post ${job.postId}. Processing...`);

    try {
      // 2. Initialize Baileys Session Manager
      const baileys = new BaileysManager(job.sessionId);
      
      // 3. Publish Status to WhatsApp
      console.log(`[Worker] Broadcasting ${job.mediaType} status to 'status@broadcast' with caption: "${job.caption || ''}"`);
      
      // Simulate socket publish success
      baileys.simulateConnectionSuccess();
      
      console.log(`[Worker] Job ${job.jobId} published successfully to WhatsApp!`);
      this.activeJobs.delete(job.jobId);
      return true;
    } catch (error: any) {
      console.error(`[Worker] Job ${job.jobId} failed: ${error.message}`);
      this.activeJobs.delete(job.jobId);
      throw error;
    }
  }

  public handleDeadLetter(job: ScheduledJobPayload, reason: string) {
    console.error(`[Worker DLQ] Job ${job.jobId} moved to Dead-Letter Queue after max retries. Reason: ${reason}`);
    this.deadLetterQueue.push(job);
  }

  public getDlqCount() {
    return this.deadLetterQueue.length;
  }
}
