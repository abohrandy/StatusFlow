import { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { pool } from '../db';
import { describeError } from '../utils/describeError';
import { asyncHandler } from '../utils/asyncHandler';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Used only to validate the bearer token the client already obtained from Supabase Auth
// (`supabase.auth.getUser(jwt)`); the anon key is safe to use server-side for this.
const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type AdminScope = 'BILLING' | 'USERS' | 'OPS';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  /** Only populated for ADMIN (by requireAdmin) — SUPER_ADMIN implicitly has every scope. */
  adminScopes?: AdminScope[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verifies the `Authorization: Bearer <supabase-jwt>` header against Supabase Auth, then
 * lazily provisions the matching row in our own `users` table (the app's public schema
 * is never written to by the Supabase signup flow itself, so this is the one place that
 * keeps them in sync). Attaches `req.user` on success.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Wrapped end-to-end: this runs as Express middleware (`.use(requireAuth)`), not a
  // route handler, so it's never passed through the asyncHandler wrapper — a rejected
  // promise here (e.g. Supabase's SDK throwing on a network error, not just returning
  // `{error}`) would otherwise crash the whole process rather than fail one request.
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization bearer token.' });
    }

    const { data, error } = await supabaseAuthClient.auth.getUser(token);
    if (error || !data.user?.email) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const { id, email } = data.user;

    const result = await pool.query<{ role: UserRole }>(
      `INSERT INTO users (id, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id
       RETURNING role`,
      [id, email],
    );

    req.user = { id, email, role: result.rows[0].role };
    next();

  } catch (err: unknown) {
    const errorDetails = describeError(err);
    console.error('[Auth] requireAuth failed:', errorDetails);
    res.status(500).json({ error: `Failed to resolve authenticated user: ${errorDetails}` });
  }
}


/**
 * Gates the whole Admin Panel to ADMIN and SUPER_ADMIN. For a plain ADMIN, also loads
 * their delegated department scopes onto req.user so downstream requireScope() checks
 * don't need their own query — SUPER_ADMIN never needs this, it implicitly has every
 * scope (see requireScope below).
 */
export const requireAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  if (req.user.role === 'ADMIN') {
    const result = await pool.query<{ scope: AdminScope }>(
      'SELECT scope FROM admin_scopes WHERE user_id = $1',
      [req.user.id],
    );
    req.user.adminScopes = result.rows.map((r) => r.scope);
  }
  next();
});

/** Delegated ADMINs only pass with the named scope; SUPER_ADMIN always passes. */
export function requireScope(scope: AdminScope) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === 'SUPER_ADMIN') return next();
    if (req.user?.role === 'ADMIN' && req.user.adminScopes?.includes(scope)) return next();
    return res.status(403).json({ error: `This requires the ${scope} admin scope.` });
  };
}

/**
 * Unlike requireScope, no ADMIN scope satisfies this — granting/revoking ADMIN access and
 * department scopes is a SUPER_ADMIN-only power, not something delegable to a department.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin access required.' });
  }
  next();
}
