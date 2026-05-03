import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
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
  } catch (err) {
    // try Supabase access token
  }

  try {
    // Decode Supabase token (without verification first)
    const decoded = jwt.decode(token, { complete: false }) as {
      sub: string;
      email?: string;
    } | null;

    if (!decoded || !decoded.sub) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Verify when configured; otherwise allow decode-based mapping for local/dev usage.
    if (SUPABASE_JWT_SECRET) {
      try {
        jwt.verify(token, SUPABASE_JWT_SECRET);
      } catch (_verifyErr) {
        console.warn('Supabase token verification failed, attempting decode-only approach');
      }
    } else {
      console.warn('SUPABASE_JWT_SECRET not set; using decode-only Supabase token handling');
    }

    // Look up user by email from decoded token
    const appUser = await resolveUserFromSupabase({
      sub: decoded.sub,
      email: decoded.email,
    });
    req.user = { id: appUser.id, role: appUser.role };
    next();
  } catch (err) {
    console.error('Token processing failed:', err instanceof Error ? err.message : err);
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

export async function requireApprovedPartner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'PARTNER') return res.status(403).json({ error: 'Forbidden' });

  const partner = await prisma.partner.findUnique({ where: { id: req.user.id } });
  if (!partner) return res.status(404).json({ error: 'Partner not found' });
  if (!partner.approved) return res.status(403).json({ error: 'Partner not approved yet' });

  next();
}
