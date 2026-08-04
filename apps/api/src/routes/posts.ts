import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getQueuePriority, requireRecurringSeriesAllowed, requireScheduleQuota } from '../middleware/subscriptionGate';
import { asyncHandler } from '../utils/asyncHandler';
import { getLatestSession } from '../repositories/whatsappRepository';
import {
  cancelStatusPost,
  createStatusPost,
  getQueueLogsForUserPost,
  getStatusPostByIdForUser,
  getStatusPostsForUser,
  type MediaType,
  type StatusPostWithMediaRow,
} from '../repositories/statusPostRepository';
import {
  cancelSeries,
  createSeries,
  getSeriesForUser,
  type RecurrenceType,
  type SeriesRow,
} from '../repositories/seriesRepository';
import { statusPostQueue } from '../queue';

export const postsRouter = Router();
postsRouter.use(requireAuth);

const MEDIA_TYPES: MediaType[] = ['TEXT', 'IMAGE', 'VIDEO'];
const RECURRENCE_TYPES: RecurrenceType[] = ['INTERVAL', 'WEEKDAYS'];
const VALID_WEEKDAYS = new Set([0, 1, 2, 3, 4, 5, 6]);

function mapSeries(row: SeriesRow) {
  return {
    id: row.id,
    mediaType: row.media_type,
    caption: row.caption,
    mediaUrl: row.media_url,
    recurrenceType: row.recurrence_type,
    intervalDays: row.interval_days,
    weekdays: row.weekdays,
    startAt: row.start_at,
    endAt: row.end_at,
    lastMaterializedAt: row.last_materialized_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

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

postsRouter.post('/recurring', requireRecurringSeriesAllowed, asyncHandler(async (req, res) => {
  const mediaType = req.body?.mediaType;
  const caption = req.body?.caption ? String(req.body.caption) : null;
  const mediaUrl = req.body?.mediaUrl ? String(req.body.mediaUrl) : null;
  const recurrenceType = req.body?.recurrenceType;
  const startAt = req.body?.startAt;
  const endAt = req.body?.endAt;

  if (!MEDIA_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be one of TEXT, IMAGE, VIDEO.' });
  }
  if (mediaType !== 'TEXT' && !mediaUrl) {
    return res.status(400).json({ error: 'mediaUrl is required for IMAGE and VIDEO status types.' });
  }
  if (!RECURRENCE_TYPES.includes(recurrenceType)) {
    return res.status(400).json({ error: 'recurrenceType must be one of INTERVAL, WEEKDAYS.' });
  }

  const startAtMs = new Date(startAt).getTime();
  const endAtMs = new Date(endAt).getTime();
  if (!startAt || Number.isNaN(startAtMs)) {
    return res.status(400).json({ error: 'startAt must be a valid ISO date string.' });
  }
  if (!endAt || Number.isNaN(endAtMs)) {
    return res.status(400).json({ error: 'endAt must be a valid ISO date string.' });
  }
  if (endAtMs <= startAtMs) {
    return res.status(400).json({ error: 'endAt must be after startAt.' });
  }
  if (endAtMs <= Date.now()) {
    return res.status(400).json({ error: 'endAt must be in the future.' });
  }

  let intervalDays: number | null = null;
  let weekdays: number[] | null = null;
  if (recurrenceType === 'INTERVAL') {
    intervalDays = Number(req.body?.intervalDays);
    if (!Number.isInteger(intervalDays) || intervalDays < 1) {
      return res.status(400).json({ error: 'intervalDays must be a positive integer.' });
    }
  } else {
    const rawWeekdays = req.body?.weekdays;
    if (!Array.isArray(rawWeekdays) || rawWeekdays.length === 0) {
      return res.status(400).json({ error: 'weekdays must be a non-empty array of numbers 0 (Sunday) to 6 (Saturday).' });
    }
    weekdays = [...new Set(rawWeekdays.map(Number))];
    if (weekdays.some((d) => !VALID_WEEKDAYS.has(d))) {
      return res.status(400).json({ error: 'weekdays must only contain numbers 0 (Sunday) to 6 (Saturday).' });
    }
  }

  const series = await createSeries({
    userId: req.user!.id,
    mediaType,
    caption,
    mediaUrl,
    recurrenceType,
    intervalDays,
    weekdays,
    startAt,
    endAt,
  });

  res.status(201).json({ series: mapSeries(series) });
}));

postsRouter.get('/recurring', asyncHandler(async (req, res) => {
  const series = await getSeriesForUser(req.user!.id);
  res.json({ series: series.map(mapSeries) });
}));

postsRouter.post('/recurring/:id/cancel', asyncHandler(async (req, res) => {
  const result = await cancelSeries(req.params.id, req.user!.id);
  if (!result) {
    return res.status(404).json({ error: 'No cancellable recurring series found with that id.' });
  }

  await Promise.all(
    result.cancelledPostIds.map(async (postId) => {
      const job = await statusPostQueue.getJob(postId);
      if (job) await job.remove();
    }),
  );

  res.json({ series: mapSeries(result.series) });
}));

postsRouter.get('/', asyncHandler(async (req, res) => {
  const posts = await getStatusPostsForUser(req.user!.id, ['DRAFT', 'SCHEDULED', 'QUEUED', 'PROCESSING']);
  res.json({ posts: posts.map(mapPost) });
}));

postsRouter.get('/history', asyncHandler(async (req, res) => {
  const posts = await getStatusPostsForUser(req.user!.id, ['COMPLETED', 'FAILED', 'CANCELLED']);
  res.json({ posts: posts.map(mapPost) });
}));

postsRouter.get('/:id/logs', asyncHandler(async (req, res) => {
  const logs = await getQueueLogsForUserPost(req.params.id, req.user!.id);
  if (logs === null) {
    return res.status(404).json({ error: 'No post found with that id.' });
  }
  res.json({
    logs: logs.map((l) => ({ id: l.id, attemptNumber: l.attempt_number, message: l.log_message, createdAt: l.created_at })),
  });
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
