import { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { pool } from '../db';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Used only to validate the bearer token the client already obtained from Supabase Auth
// (`supabase.auth.getUser(jwt)`); the anon key is safe to use server-side for this.
const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
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

    const result = await pool.query<{ role: 'USER' | 'ADMIN' }>(
      `INSERT INTO users (id, email)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
       RETURNING role`,
      [id, email],
    );

    req.user = { id, email, role: result.rows[0].role };
    next();
  } catch (err: any) {
    console.error('[Auth] requireAuth failed:', err.message);
    res.status(500).json({ error: 'Failed to resolve authenticated user.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
