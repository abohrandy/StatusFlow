import { Router } from 'express';
import { isPlanSlug } from '@statusflow/subscriptions';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { getUserIdByEmail } from '../repositories/billingRepository';
import {
  adminCancelSubscription,
  extendSubscription,
  getDashboardStats,
  getSubscriptionDetail,
  listInvoices,
  listPayments,
  listReferralRewards,
  listUsers,
  listWebhookLogs,
  manuallyActivateSubscription,
  searchSubscriptions,
} from '../repositories/adminBillingRepository';
import { asyncHandler } from '../utils/asyncHandler';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/dashboard', asyncHandler(async (req, res) => {
  res.json(await getDashboardStats());
}));

adminRouter.get('/subscriptions', asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  res.json({ subscriptions: await searchSubscriptions(search) });
}));

adminRouter.get('/users', asyncHandler(async (_req, res) => {
  res.json({ users: await listUsers() });
}));

adminRouter.get('/subscriptions/:id', asyncHandler(async (req, res) => {
  const detail = await getSubscriptionDetail(req.params.id);
  if (!detail) return res.status(404).json({ error: 'Subscription not found.' });
  res.json(detail);
}));

adminRouter.post('/subscriptions/:id/cancel', asyncHandler(async (req, res) => {
  const updated = await adminCancelSubscription(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Subscription not found.' });
  res.json({ subscription: updated });
}));

adminRouter.post('/subscriptions/:id/extend', asyncHandler(async (req, res) => {
  const days = Number(req.body?.days);
  if (!Number.isFinite(days) || days <= 0) {
    return res.status(400).json({ error: 'A positive number of days is required.' });
  }
  const updated = await extendSubscription(req.params.id, days);
  if (!updated) return res.status(404).json({ error: 'Subscription not found.' });
  res.json({ subscription: updated });
}));

adminRouter.post('/subscriptions/activate', asyncHandler(async (req, res) => {
  const { email, planSlug } = req.body ?? {};
  if (typeof email !== 'string' || !isPlanSlug(planSlug)) {
    return res.status(400).json({ error: 'email and a valid planSlug are required.' });
  }
  const userId = await getUserIdByEmail(email);
  if (!userId) {
    return res.status(404).json({ error: `No user found with email "${email}".` });
  }
  const subscription = await manuallyActivateSubscription({ userId, planSlug });
  res.status(201).json({ subscription });
}));

adminRouter.get('/payments', asyncHandler(async (req, res) => {
  res.json({ payments: await listPayments() });
}));

adminRouter.get('/invoices', asyncHandler(async (req, res) => {
  res.json({ invoices: await listInvoices() });
}));

adminRouter.get('/webhook-logs', asyncHandler(async (req, res) => {
  res.json({ webhookLogs: await listWebhookLogs() });
}));

adminRouter.get('/referral-rewards', asyncHandler(async (req, res) => {
  res.json({ referralRewards: await listReferralRewards() });
}));
