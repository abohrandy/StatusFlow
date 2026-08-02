import { Router } from 'express';
import { assertCanConnectWhatsAppAccount, SubscriptionError, type PlanSlug } from '@statusflow/subscriptions';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { getActiveSubscription } from '../repositories/billingRepository';
import {
  createPairingSession,
  getActiveSessionCount,
  getLatestSession,
  isPhoneNumberBlockedForTrial,
  markSessionConnected,
  markSessionDisconnected,
  recordTrialPhoneNumber,
} from '../repositories/whatsappRepository';

export const whatsappRouter = Router();
whatsappRouter.use(requireAuth);

// Loose E.164-ish check (leading +, 8-15 digits) — good enough to reject obvious garbage
// without rejecting real international numbers in unfamiliar formats.
const PHONE_NUMBER_PATTERN = /^\+?[1-9]\d{7,14}$/;

function generateMockPairingCode(): string {
  // The real Baileys pairing-code flow isn't wired up yet (that's a separate, much larger
  // integration) — this mock keeps the existing UI behavior working while making the phone
  // number and session state genuinely persisted, which is what the anti-abuse check needs.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}`;
}

whatsappRouter.post('/pairing/request', asyncHandler(async (req, res) => {
  const phoneNumber = String(req.body?.phoneNumber ?? '').trim();
  if (!PHONE_NUMBER_PATTERN.test(phoneNumber)) {
    return res.status(400).json({ error: 'Enter a valid WhatsApp phone number with country code, e.g. +2348123456789.' });
  }

  const sub = await getActiveSubscription(req.user!.id);
  const planSlug: PlanSlug = sub?.plan_slug ?? 'free';

  try {
    assertCanConnectWhatsAppAccount(planSlug, await getActiveSessionCount(req.user!.id));
  } catch (err) {
    if (err instanceof SubscriptionError) return res.status(403).json(err.toJSON());
    throw err;
  }

  // Only Free-plan accounts are subject to the one-trial-per-phone-number rule — a paying
  // customer connecting a number some past free-trial account also used isn't the abuse
  // this exists to prevent.
  if (planSlug === 'free' && (await isPhoneNumberBlockedForTrial(phoneNumber, req.user!.id))) {
    return res.status(403).json(
      new SubscriptionError(
        'PHONE_NUMBER_ALREADY_USED_FOR_TRIAL',
        'This phone number has already been used for a free trial.',
        { upgrade: { planSlug: 'weekly-pro', planName: 'Weekly Pro', message: 'Upgrade to Weekly Pro to connect it anyway.' } },
      ).toJSON(),
    );
  }

  const session = await createPairingSession(req.user!.id, phoneNumber);
  if (planSlug === 'free') {
    await recordTrialPhoneNumber(phoneNumber, req.user!.id);
  }

  res.status(201).json({ sessionId: session.id, pairingCode: generateMockPairingCode() });
}));

whatsappRouter.post('/pairing/confirm', asyncHandler(async (req, res) => {
  const sessionId = String(req.body?.sessionId ?? '');
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required.' });
  }

  const session = await markSessionConnected(sessionId, req.user!.id);
  if (!session) {
    return res.status(404).json({ error: 'No matching pairing session found.' });
  }

  res.json({ connected: true, phoneNumber: session.phone_number });
}));

whatsappRouter.post('/disconnect', asyncHandler(async (req, res) => {
  await markSessionDisconnected(req.user!.id);
  res.json({ ok: true });
}));

whatsappRouter.get('/status', asyncHandler(async (req, res) => {
  const session = await getLatestSession(req.user!.id);
  res.json({
    connected: session?.status === 'CONNECTED',
    status: session?.status ?? 'UNINITIALIZED',
    phoneNumber: session?.phone_number ?? null,
  });
}));
