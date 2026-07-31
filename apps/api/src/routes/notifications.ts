import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../repositories/notificationRepository';
import { asyncHandler } from '../utils/asyncHandler';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ notifications: await listNotifications(req.user!.id) });
}));

notificationsRouter.post('/:id/read', asyncHandler(async (req, res) => {
  await markNotificationRead(req.user!.id, req.params.id);
  res.json({ ok: true });
}));

notificationsRouter.post('/read-all', asyncHandler(async (req, res) => {
  await markAllNotificationsRead(req.user!.id);
  res.json({ ok: true });
}));
