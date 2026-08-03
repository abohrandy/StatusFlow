import { Router } from 'express';
import { assertCanConnectWhatsAppAccount, SubscriptionError, type PlanSlug } from '@statusflow/subscriptions';
import { WhatsAppConnection } from '@statusflow/baileys-engine';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';
import { describeError } from '../utils/describeError';
import { getActiveSubscription } from '../repositories/billingRepository';
import { redisConnection } from '../redis';
import {
  createPairingSession,
  getActiveSessionCount,
  getLatestSession,
  isPhoneNumberBlockedForTrial,
  markSessionConnected,
  markSessionDisconnected,
  markPairingSessionFailed,
  recordTrialPhoneNumber,
} from '../repositories/whatsappRepository';

export const whatsappRouter = Router();
whatsappRouter.use(requireAuth);
const activeConnections = new Map<string, WhatsAppConnection>();

// Loose E.164-ish check (leading +, 8-15 digits) — good enough to reject obvious garbage
// without rejecting real international numbers in unfamiliar formats.
const PHONE_NUMBER_PATTERN = /^\+?[1-9]\d{7,14}$/;

whatsappRouter.post('/pairing/request', rateLimiter(5, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  const method = req.body?.method === 'QR_CODE' ? 'QR_CODE' : 'PAIRING_CODE';
  const phoneNumber = String(req.body?.phoneNumber ?? '').trim();
  const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
  if (method === 'PAIRING_CODE' && !PHONE_NUMBER_PATTERN.test(phoneNumber)) {
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
  if (planSlug === 'free' && method === 'PAIRING_CODE' && (await isPhoneNumberBlockedForTrial(normalizedPhoneNumber, req.user!.id))) {
    return res.status(403).json(
      new SubscriptionError(
        'PHONE_NUMBER_ALREADY_USED_FOR_TRIAL',
        'This phone number has already been used for a free trial.',
        { upgrade: { planSlug: 'weekly-pro', planName: 'Weekly Pro', message: 'Upgrade to Weekly Pro to connect it anyway.' } },
      ).toJSON(),
    );
  }

  const session = await createPairingSession(req.user!.id, method === 'PAIRING_CODE' ? normalizedPhoneNumber : '');
  const connection = new WhatsAppConnection(session.id, redisConnection);
  activeConnections.set(session.id, connection);
  if (method === 'QR_CODE') {
    try {
      const qrCode = await connection.requestQrCode();
      return res.status(201).json({ sessionId: session.id, qrCode });
    } catch (err) {
      await markPairingSessionFailed(session.id, req.user!.id);
      activeConnections.delete(session.id);
      console.error('[WhatsApp] QR request failed:', describeError(err));
      return res.status(502).json({ error: `WhatsApp QR could not be generated: ${describeError(err)}` });
    }
  }
  let pairingCode: string;
  try {
    // Baileys expects the country-code number as digits, without the leading plus.
    pairingCode = await connection.requestPairingCode(normalizedPhoneNumber);
  } catch (err) {
    await markPairingSessionFailed(session.id, req.user!.id);
    activeConnections.delete(session.id);
    console.error('[WhatsApp] Pairing code request failed:', describeError(err));
    return res.status(502).json({ error: `WhatsApp pairing could not be started: ${describeError(err)}` });
  }
  activeConnections.set(session.id, connection);
  if (planSlug === 'free') await recordTrialPhoneNumber(normalizedPhoneNumber, req.user!.id);

  res.status(201).json({ sessionId: session.id, pairingCode });
}));


whatsappRouter.post('/pairing/confirm', rateLimiter(20, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  const sessionId = String(req.body?.sessionId ?? '');
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required.' });
  }

  const connection = activeConnections.get(sessionId);
  if (!connection || !(await connection.waitUntilOpen(2_000))) {
    return res.status(409).json({ error: 'WhatsApp pairing has not been completed yet.' });
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
