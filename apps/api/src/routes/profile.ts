import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { getProfile, upsertProfile } from '../repositories/profileRepository';

export const profileRouter = Router();
profileRouter.use(requireAuth);

profileRouter.get('/', asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user!.id);
  res.json({
    // "Onboarded" means they've supplied a name — used by the client to decide whether to
    // show the onboarding form again after login, instead of a client-only flag that reset
    // on every fresh session.
    onboarded: !!profile?.full_name,
    fullName: profile?.full_name ?? null,
    companyName: profile?.company_name ?? null,
    timezone: profile?.timezone ?? 'UTC',
    role: req.user!.role,
  });
}));

profileRouter.put('/', asyncHandler(async (req, res) => {
  const fullName = String(req.body?.fullName ?? '').trim();
  const companyName = String(req.body?.companyName ?? '').trim();
  const timezone = req.body?.timezone !== undefined ? String(req.body.timezone).trim() : undefined;
  if (!fullName || !companyName) {
    return res.status(400).json({ error: 'fullName and companyName are both required.' });
  }

  const profile = await upsertProfile({ userId: req.user!.id, fullName, companyName, timezone: timezone || undefined });
  res.json({ fullName: profile.full_name, companyName: profile.company_name, timezone: profile.timezone });
}));
