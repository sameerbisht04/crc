import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { resolveUserFromSupabase } from '../services/supabaseUser';

export type AuthUser = { id: string; role: 'STUDENT' | 'PARTNER' | 'ADMIN' };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    req.user = { id: payload.sub, role: payload.role as AuthUser['role'] };
    next();
    return;
  } catch {
    // try Supabase access token
  }

  if (!SUPABASE_JWT_SECRET) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  try {
    const sbPayload = jwt.verify(token, SUPABASE_JWT_SECRET) as {
      sub: string;
      email?: string;
    };
    const appUser = await resolveUserFromSupabase({
      sub: sbPayload.sub,
      email: sbPayload.email,
    });
    req.user = { id: appUser.id, role: appUser.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
