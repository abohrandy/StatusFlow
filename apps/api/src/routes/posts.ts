import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getQueuePriority, requireScheduleQuota } from '../middleware/subscriptionGate';
import { asyncHandler } from '../utils/asyncHandler';
import { getLatestSession } from '../repositories/whatsappRepository';
import {
  cancelStatusPost,
  createStatusPost,
  getStatusPostByIdForUser,
  getStatusPostsForUser,
  type MediaType,
  type StatusPostWithMediaRow,
} from '../repositories/statusPostRepository';
import { statusPostQueue } from '../queue';

export const postsRouter = Router();
postsRouter.use(requireAuth);

const MEDIA_TYPES: MediaType[] = ['TEXT', 'IMAGE', 'VIDEO'];

function mapPost(row: StatusPostWithMediaRow) {
  return {
    id: row.id,
    mediaType: row.media_type,
    caption: row.caption,
    mediaUrl: row.media_url,
    scheduledAt: row.scheduled_at,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

postsRouter.post('/', requireScheduleQuota, asyncHandler(async (req, res) => {
  const mediaType = req.body?.mediaType;
  const scheduledAt = req.body?.scheduledAt;
  const caption = req.body?.caption ? String(req.body.caption) : null;
  const mediaUrl = req.body?.mediaUrl ? String(req.body.mediaUrl) : null;

  if (!MEDIA_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be one of TEXT, IMAGE, VIDEO.' });
  }
  const scheduledAtMs = new Date(scheduledAt).getTime();
  if (!scheduledAt || Number.isNaN(scheduledAtMs)) {
    return res.status(400).json({ error: 'scheduledAt must be a valid ISO date string.' });
  }
  if (scheduledAtMs <= Date.now()) {
    return res.status(400).json({ error: 'scheduledAt must be in the future.' });
  }
  if (mediaType !== 'TEXT' && !mediaUrl) {
    return res.status(400).json({ error: 'mediaUrl is required for IMAGE and VIDEO status types.' });
  }

  const session = await getLatestSession(req.user!.id);
  const post = await createStatusPost({
    userId: req.user!.id,
    sessionId: session?.id ?? null,
    mediaType,
    caption,
    mediaUrl,
    scheduledAt,
  });

  const priority = await getQueuePriority(req.user!.id);
  await statusPostQueue.add(
    'publish',
    { postId: post.id },
    {
      jobId: post.id,
      delay: Math.max(0, scheduledAtMs - Date.now()),
      priority,
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    },
  );

  res.status(201).json({ post: mapPost(post) });
}));

postsRouter.get('/', asyncHandler(async (req, res) => {
  const posts = await getStatusPostsForUser(req.user!.id, ['DRAFT', 'SCHEDULED', 'QUEUED', 'PROCESSING']);
  res.json({ posts: posts.map(mapPost) });
}));

postsRouter.get('/history', asyncHandler(async (req, res) => {
  const posts = await getStatusPostsForUser(req.user!.id, ['COMPLETED', 'FAILED', 'CANCELLED']);
  res.json({ posts: posts.map(mapPost) });
}));

postsRouter.post('/:id/cancel', asyncHandler(async (req, res) => {
  const cancelled = await cancelStatusPost(req.params.id, req.user!.id);
  if (!cancelled) {
    return res.status(404).json({ error: 'No cancellable post found with that id — it may already be sending or resolved.' });
  }

  const job = await statusPostQueue.getJob(cancelled.id);
  if (job) await job.remove();

  const full = await getStatusPostByIdForUser(cancelled.id, req.user!.id);
  res.json({ post: mapPost(full!) });
}));
