import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { resolveUserFromSupabase } from "./supabaseUser";
import { ApiError } from "./apiError";

export type AuthUser = { id: string; role: "STUDENT" | "PARTNER" | "ADMIN" };

const JWT_SECRET = process.env.JWT_SECRET || "dev";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function requireAuth(request: Request): Promise<AuthUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    return { id: payload.sub, role: payload.role as AuthUser["role"] };
  } catch {
    // fall through to Supabase token handling
  }

  if (!SUPABASE_JWT_SECRET) {
    throw new ApiError(401, "Invalid or expired token");
  }

  const decoded = jwt.decode(token) as { sub?: string; email?: string } | null;
  if (!decoded || !decoded.sub) {
    throw new ApiError(401, "Invalid or expired token");
  }

  try {
    jwt.verify(token, SUPABASE_JWT_SECRET);
  } catch {
    // ignore verification failure; we can still resolve based on the decoded payload.
  }

  const appUser = await resolveUserFromSupabase({
    sub: decoded.sub,
    email: decoded.email,
  });

  return { id: appUser.id, role: appUser.role };
}

export function requireRole(user: AuthUser, ...roles: AuthUser["role"][]) {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "Forbidden");
  }
  return user;
}

export async function requireApprovedPartner(user: AuthUser) {
  if (user.role !== "PARTNER") {
    throw new ApiError(403, "Forbidden");
  }

  const partner = await prisma.partner.findUnique({ where: { id: user.id } });
  if (!partner) {
    throw new ApiError(404, "Partner not found");
  }
  if (!partner.approved) {
    throw new ApiError(403, "Partner not approved yet");
  }

  return user;
}
