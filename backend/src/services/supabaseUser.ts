import bcrypt from 'bcrypt';
import { prisma } from '../prisma';

type SupabaseJwtPayload = {
  sub: string;
  email?: string;
};

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Resolve Supabase Auth → Prisma User for API auth.
 * - Emails listed in ADMIN_EMAILS get role ADMIN (create / promote as needed).
 * - Existing DB admins always get ADMIN.
 * - Otherwise STUDENT (create row on first use).
 */
export async function resolveUserFromSupabase(
  payload: SupabaseJwtPayload
): Promise<{ id: string; role: 'STUDENT' | 'ADMIN' }> {
  const email = payload.email?.toLowerCase().trim();
  if (!email) {
    throw new Error('Supabase token has no email claim');
  }

  const wantAdmin = parseAdminEmails().has(email);
  let user = await prisma.user.findUnique({ where: { email } });

  if (user?.role === 'ADMIN') {
    return { id: user.id, role: 'ADMIN' };
  }

  if (wantAdmin) {
    if (!user) {
      const passwordHash = await bcrypt.hash(`supabase-admin:${payload.sub}`, 10);
      user = await prisma.user.create({
        data: {
          email,
          studentId: `sb-adm-${payload.sub.replace(/-/g, '').slice(0, 10)}`,
          passwordHash,
          name: email.split('@')[0] || 'Admin',
          role: 'ADMIN',
        },
      });
    } else if (user.role === 'STUDENT') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    } else {
      throw new Error('This email is registered with a non-admin role');
    }
    return { id: user.id, role: 'ADMIN' };
  }

  if (user) {
    if (user.role !== 'STUDENT') {
      throw new Error('This account is not a student in the app database');
    }
    return { id: user.id, role: 'STUDENT' };
  }

  const passwordHash = await bcrypt.hash(`supabase:${payload.sub}`, 10);
  const created = await prisma.user.create({
    data: {
      email,
      studentId: `sb-${payload.sub.replace(/-/g, '').slice(0, 12)}`,
      passwordHash,
      name: email.split('@')[0] || 'Student',
      role: 'STUDENT',
    },
  });
  return { id: created.id, role: 'STUDENT' };
}
