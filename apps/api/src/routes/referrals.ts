import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { attributeReferralSignup, getOrCreateCode, getReferralDashboard, inviteByEmail } from '../services/referralService';
import { asyncHandler } from '../utils/asyncHandler';

export const referralsRouter = Router();

referralsRouter.use(requireAuth);

referralsRouter.get('/code', asyncHandler(async (req, res) => {
  const code = await getOrCreateCode(req.user!.id);
  res.json({ code });
}));

referralsRouter.post('/invite', asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email : undefined;
  await inviteByEmail(req.user!.id, email);
  res.status(201).json({ ok: true });
}));

/**
 * Called once, right after a new user completes signup, if they arrived via a referral
 * link (`?ref=CODE`). Attribution only sticks the first time — see
 * referralRepository.attributeSignup for the abuse-prevention details.
 */
referralsRouter.post('/attribute', asyncHandler(async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!code) {
    return res.status(400).json({ error: 'A referral code is required.' });
  }
  await attributeReferralSignup(code, req.user!.id);
  res.status(200).json({ ok: true });
}));

referralsRouter.get('/dashboard', asyncHandler(async (req, res) => {
  const dashboard = await getReferralDashboard(req.user!.id);
  res.json(dashboard);
}));
