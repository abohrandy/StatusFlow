import { Router } from 'express';
import { isPlanSlug } from '@statusflow/subscriptions';
import { requireAdmin, requireAuth, requireScope, requireSuperAdmin, type AdminScope } from '../middleware/auth';
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
  setUserRole,
  setUserScopes,
} from '../repositories/adminBillingRepository';
import { asyncHandler } from '../utils/asyncHandler';

const ADMIN_SCOPES: AdminScope[] = ['BILLING', 'USERS', 'OPS'];
const ASSIGNABLE_ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

// Available to any admin-tier user (no department scope needed) — an aggregate overview,
// not per-department data, and the Admin Panel's landing tab.
adminRouter.get('/dashboard', asyncHandler(async (req, res) => {
  res.json(await getDashboardStats());
}));

/** Tells the client which Admin Panel tabs to render for the current user. */
adminRouter.get('/me', asyncHandler(async (req, res) => {
  res.json({ role: req.user!.role, scopes: req.user!.adminScopes ?? [] });
}));

adminRouter.get('/subscriptions', requireScope('BILLING'), asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  res.json({ subscriptions: await searchSubscriptions(search) });
}));

adminRouter.get('/users', requireScope('USERS'), asyncHandler(async (_req, res) => {
  res.json({ users: await listUsers() });
}));

/** SUPER_ADMIN-only: sets a user's role and, for ADMIN, their delegated department scopes. */
adminRouter.put('/users/:id/access', requireSuperAdmin, asyncHandler(async (req, res) => {
  const role = req.body?.role;
  const scopes = req.body?.scopes;
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${ASSIGNABLE_ROLES.join(', ')}.` });
  }
  if (role === 'ADMIN') {
    if (!Array.isArray(scopes) || scopes.some((s) => !ADMIN_SCOPES.includes(s))) {
      return res.status(400).json({ error: `scopes must be an array drawn from ${ADMIN_SCOPES.join(', ')}.` });
    }
  }
  await setUserRole(req.params.id, role);
  if (role === 'ADMIN') {
    await setUserScopes(req.params.id, scopes, req.user!.id);
  }
  res.json({ ok: true });
}));

adminRouter.get('/subscriptions/:id', requireScope('BILLING'), asyncHandler(async (req, res) => {
  const detail = await getSubscriptionDetail(req.params.id);
  if (!detail) return res.status(404).json({ error: 'Subscription not found.' });
  res.json(detail);
}));

adminRouter.post('/subscriptions/:id/cancel', requireScope('BILLING'), asyncHandler(async (req, res) => {
  const updated = await adminCancelSubscription(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Subscription not found.' });
  res.json({ subscription: updated });
}));

adminRouter.post('/subscriptions/:id/extend', requireScope('BILLING'), asyncHandler(async (req, res) => {
  const days = Number(req.body?.days);
  if (!Number.isFinite(days) || days <= 0) {
    return res.status(400).json({ error: 'A positive number of days is required.' });
  }
  const updated = await extendSubscription(req.params.id, days);
  if (!updated) return res.status(404).json({ error: 'Subscription not found.' });
  res.json({ subscription: updated });
}));

adminRouter.post('/subscriptions/activate', requireScope('BILLING'), asyncHandler(async (req, res) => {
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

adminRouter.get('/payments', requireScope('BILLING'), asyncHandler(async (req, res) => {
  res.json({ payments: await listPayments() });
}));

adminRouter.get('/invoices', requireScope('BILLING'), asyncHandler(async (req, res) => {
  res.json({ invoices: await listInvoices() });
}));

adminRouter.get('/webhook-logs', requireScope('OPS'), asyncHandler(async (req, res) => {
  res.json({ webhookLogs: await listWebhookLogs() });
}));

adminRouter.get('/referral-rewards', requireScope('BILLING'), asyncHandler(async (req, res) => {
  res.json({ referralRewards: await listReferralRewards() });
}));
