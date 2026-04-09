import bcrypt from 'bcrypt';
import { prisma } from "./prisma";

type SupabaseJwtPayload = {
  sub: string;
  email?: string;
  role?: string;
  user_metadata?: { role?: string; name?: string };
  app_metadata?: { role?: string };
};

function parseAdminEmails(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

function normalizeRole(value: unknown): "ADMIN" | "PARTNER" | "STUDENT" | null {
  if (typeof value !== "string") return null;
  const role = value.toUpperCase();
  if (role === "ADMIN" || role === "PARTNER" || role === "STUDENT") return role;
  return null;
}

function getRoleFromPayload(payload: SupabaseJwtPayload): "ADMIN" | "PARTNER" | "STUDENT" | null {
  return (
    normalizeRole(payload.role) ||
    normalizeRole(payload.user_metadata?.role) ||
    normalizeRole(payload.app_metadata?.role) ||
    null
  );
}

export async function resolveUserFromSupabase(
  payload: SupabaseJwtPayload
): Promise<{ id: string; role: "STUDENT" | "PARTNER" | "ADMIN" }> {
  const email = payload.email?.toLowerCase().trim();
  if (!email) {
    throw new Error("Supabase token has no email claim");
  }

  const wantAdmin = parseAdminEmails().has(email);
  const tokenRole = getRoleFromPayload(payload);

  const existingPartner = await prisma.partner.findUnique({ where: { email } });
  if (existingPartner) {
    return { id: existingPartner.id, role: "PARTNER" };
  }

  if (tokenRole === "PARTNER") {
    const name = payload.user_metadata?.name || email.split("@")[0] || "Partner";
    const passwordHash = await bcrypt.hash(`supabase:${payload.sub}`, 10);
    const partner = await prisma.partner.create({
      data: {
        email,
        name,
        phone: "",
        passwordHash,
        approved: false,
      },
    });
    return { id: partner.id, role: "PARTNER" };
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (user?.role === "ADMIN") {
    return { id: user.id, role: "ADMIN" };
  }

  if (wantAdmin || tokenRole === "ADMIN") {
    if (!user) {
      const passwordHash = await bcrypt.hash(`supabase-admin:${payload.sub}`, 10);
      user = await prisma.user.create({
        data: {
          email,
          studentId: `sb-adm-${payload.sub.replace(/-/g, "").slice(0, 10)}`,
          passwordHash,
          name: payload.user_metadata?.name || email.split("@")[0] || "Admin",
          role: "ADMIN",
        },
      });
    } else if (user.role === "STUDENT") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    } else if (user.role === "PARTNER") {
      throw new Error("This account is registered with a non-admin role");
    }
    return { id: user.id, role: "ADMIN" };
  }

  if (user) {
    return { id: user.id, role: user.role };
  }

  const passwordHash = await bcrypt.hash(`supabase:${payload.sub}`, 10);
  const created = await prisma.user.create({
    data: {
      email,
      studentId: `sb-${payload.sub.replace(/-/g, "").slice(0, 12)}`,
      passwordHash,
      name: payload.user_metadata?.name || email.split("@")[0] || "Student",
      role: "STUDENT",
    },
  });
  return { id: created.id, role: "STUDENT" };
}
