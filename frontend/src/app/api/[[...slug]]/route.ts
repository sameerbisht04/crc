import { ApiError, handleApiError } from "@/lib/server/apiError";
import { requireApprovedPartner, requireAuth, requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "dev";

const registerSchema = z.object({
  email: z.string().email(),
  studentId: z.string().min(4),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const partnerApplySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(6),
  usn: z.string().optional().default(""),
  collegeYear: z.string().optional().default(""),
  enrollmentNo: z.string().optional().default(""),
  idCardUrl: z.string().optional().default(""),
});

const createOrderSchema = z.object({
  type: z.enum(["FOOD", "GROCERIES", "PARCEL"]),
  pickupLocation: z.string().min(1),
  dropLocation: z.string().min(1),
  notes: z.string().optional(),
  paymentMethod: z.enum(["UPI", "CARD", "COD"]),
  amount: z.number().int().min(0).optional(),
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED"]),
});

function createToken(payload: { sub: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function routeSegments(params: { slug?: string[] }) {
  return params.slug ?? [];
}

function isMatch(segments: string[], expected: string[]) {
  return segments.length === expected.length && segments.every((segment, index) => expected[index] === segment);
}

async function handleAuthRegister(request: Request) {
  const body = await request.json();
  const { email, studentId, password, name } = registerSchema.parse(body);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, studentId, passwordHash, name, role: "STUDENT" },
  });
  const token = createToken({ sub: user.id, role: user.role });
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, studentId: user.studentId },
  });
}

async function handleAuthLogin(request: Request) {
  const body = await request.json();
  const { email, password } = loginSchema.parse(body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid credentials");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");
  const token = createToken({ sub: user.id, role: user.role });
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, studentId: user.studentId },
  });
}

async function handlePartnerLogin(request: Request) {
  const body = await request.json();
  const { email, password } = loginSchema.parse(body);
  const partner = await prisma.partner.findUnique({ where: { email } });
  if (!partner) throw new ApiError(401, "Invalid credentials");
  const ok = await bcrypt.compare(password, partner.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");
  if (!partner.approved) throw new ApiError(403, "Partner not approved yet");
  const token = createToken({ sub: partner.id, role: "PARTNER" });
  return NextResponse.json({ token, user: { id: partner.id, email: partner.email, name: partner.name, role: "PARTNER" } });
}

async function handleAuthMe(request: Request) {
  const user = await requireAuth(request);
  if (user.role === "PARTNER") {
    const partner = await prisma.partner.findUnique({ where: { id: user.id } });
    if (!partner) throw new ApiError(404, "Partner not found");
    return NextResponse.json({
      id: partner.id,
      email: partner.email,
      name: partner.name,
      role: "PARTNER",
      approved: partner.approved,
      earnings: partner.earnings,
    });
  }
  const appUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!appUser) throw new ApiError(404, "User not found");
  return NextResponse.json({
    id: appUser.id,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
    studentId: appUser.studentId,
  });
}

async function handleAuthDebugToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return NextResponse.json({ error: "No token provided" }, { status: 400 });

  const decoded = jwt.decode(token, { complete: true });
  return NextResponse.json({
    decoded,
    environment: { hasJwtSecret: !!process.env.JWT_SECRET, hasSupabaseSecret: !!process.env.SUPABASE_JWT_SECRET },
  });
}

async function handlePartnerApply(request: Request) {
  const body = await request.json();
  const { email, name, phone, password, usn, collegeYear, enrollmentNo, idCardUrl } = partnerApplySchema.parse(body);
  const passwordHash = await bcrypt.hash(password, 10);
  const partner = await prisma.partner.create({
    data: { email, name, phone, passwordHash, usn, collegeYear, enrollmentNo, idCardUrl },
  });
  return NextResponse.json({
    id: partner.id,
    email: partner.email,
    name: partner.name,
    phone: partner.phone,
    usn: partner.usn,
    collegeYear: partner.collegeYear,
    enrollmentNo: partner.enrollmentNo,
    idCardUrl: partner.idCardUrl,
    approved: partner.approved,
  });
}

async function handlePartnerOrders(request: Request) {
  const user = await requireAuth(request);
  requireRole(user, "PARTNER");
  await requireApprovedPartner(user);
  const orders = await prisma.order.findMany({
    where: { partnerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { student: { select: { name: true, email: true } } },
  });
  return NextResponse.json(orders);
}

async function handlePartnerAccept(request: Request, orderId: string) {
  const user = await requireAuth(request);
  requireRole(user, "PARTNER");
  await requireApprovedPartner(user);
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.partnerId) throw new ApiError(400, "Order already accepted");
  if (order.status !== "PENDING") throw new ApiError(400, "Order not available");
  const updated = await prisma.order.update({ where: { id: orderId }, data: { partnerId: user.id, status: "PICKED_UP" } });
  return NextResponse.json(updated);
}

async function handleCreateOrder(request: Request) {
  const user = await requireAuth(request);
  requireRole(user, "STUDENT");
  const body = await request.json();
  const data = createOrderSchema.parse(body);
  const order = await prisma.order.create({
    data: {
      type: data.type,
      pickupLocation: data.pickupLocation,
      dropLocation: data.dropLocation,
      notes: data.notes ?? null,
      paymentMethod: data.paymentMethod,
      status: "PENDING",
      studentId: user.id,
      amount: data.amount ?? 0,
    },
  });
  return NextResponse.json(order);
}

async function handleStudentOrders(request: Request) {
  const user = await requireAuth(request);
  requireRole(user, "STUDENT");
  const orders = await prisma.order.findMany({
    where: { studentId: user.id },
    orderBy: { createdAt: "desc" },
    include: { partner: true },
  });
  return NextResponse.json(orders);
}

async function handleAvailableOrders(request: Request) {
  const user = await requireAuth(request);
  requireRole(user, "PARTNER");
  await requireApprovedPartner(user);
  const orders = await prisma.order.findMany({
    where: { status: "PENDING", partnerId: null },
    orderBy: { createdAt: "desc" },
    include: { student: { select: { name: true, email: true } } },
  });
  return NextResponse.json(orders);
}

async function handleGetOrder(request: Request, orderId: string) {
  const user = await requireAuth(request);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { student: { select: { name: true, email: true } }, partner: { select: { name: true, phone: true } } },
  });
  if (!order) throw new ApiError(404, "Order not found");
  const allowed = user.role === "ADMIN" || order.studentId === user.id || order.partnerId === user.id;
  if (!allowed) throw new ApiError(403, "Forbidden");
  return NextResponse.json(order);
}

async function handleOrderStatusUpdate(request: Request, orderId: string) {
  const user = await requireAuth(request);
  const { status } = statusSchema.parse(await request.json());
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  const canUpdate = user.role === "ADMIN" || order.partnerId === user.id;
  if (!canUpdate) throw new ApiError(403, "Forbidden");
  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });
  if (status === "DELIVERED" && order.partnerId) {
    await prisma.partner.update({ where: { id: order.partnerId }, data: { earnings: { increment: order.amount } } });
  }
  return NextResponse.json(updated);
}

async function handleAdminStats(request: Request) {
  const user = await requireAuth(request);
  requireRole(user, "ADMIN");
  const [ordersToday, totalEarnings] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: new Date(new Date().toDateString()) } } }),
    prisma.order.aggregate({ _sum: { amount: true } }),
  ]);
  return NextResponse.json({ ordersToday, totalEarnings: totalEarnings._sum.amount || 0 });
}

async function handleAdminOrders(request: Request) {
  const user = await requireAuth(request);
  requireRole(user, "ADMIN");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: { select: { name: true, email: true } }, partner: { select: { name: true } } },
  });
  return NextResponse.json(orders);
}

async function handleAdminPartnersPending(request: Request) {
  const user = await requireAuth(request);
  requireRole(user, "ADMIN");
  const partners = await prisma.partner.findMany({ where: { approved: false } });
  return NextResponse.json(partners);
}

async function handleAdminApprovePartner(request: Request, partnerId: string) {
  const user = await requireAuth(request);
  requireRole(user, "ADMIN");
  const partner = await prisma.partner.update({ where: { id: partnerId }, data: { approved: true } });
  return NextResponse.json(partner);
}

export async function GET(request: Request, { params }: { params: { slug?: string[] } }) {
  const segments = routeSegments(params);
  try {
    if (isMatch(segments, ["auth", "me"])) return await handleAuthMe(request);
    if (isMatch(segments, ["auth", "debug-token"])) return await handleAuthDebugToken(request);
    if (isMatch(segments, ["partners", "me", "orders"])) return await handlePartnerOrders(request);
    if (isMatch(segments, ["orders", "mine"])) return await handleStudentOrders(request);
    if (isMatch(segments, ["orders", "available"])) return await handleAvailableOrders(request);
    if (isMatch(segments, ["admin", "stats"])) return await handleAdminStats(request);
    if (isMatch(segments, ["admin", "orders"])) return await handleAdminOrders(request);
    if (isMatch(segments, ["admin", "partners", "pending"])) return await handleAdminPartnersPending(request);
    if (segments.length === 2 && segments[0] === "orders") return await handleGetOrder(request, segments[1]);
    throw new ApiError(404, "Not found");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request, { params }: { params: { slug?: string[] } }) {
  const segments = routeSegments(params);
  try {
    if (isMatch(segments, ["auth", "register"])) return await handleAuthRegister(request);
    if (isMatch(segments, ["auth", "login"])) return await handleAuthLogin(request);
    if (isMatch(segments, ["auth", "partner-login"])) return await handlePartnerLogin(request);
    if (isMatch(segments, ["partners", "apply"])) return await handlePartnerApply(request);
    if (isMatch(segments, ["partners", "me", "orders"])) throw new ApiError(405, "Method Not Allowed");
    if (isMatch(segments, ["orders"])) return await handleCreateOrder(request);
    if (segments.length === 3 && segments[0] === "partners" && segments[1] === "accept") return await handlePartnerAccept(request, segments[2]);
    if (segments.length === 4 && segments[0] === "admin" && segments[1] === "partners" && segments[3] === "approve") return await handleAdminApprovePartner(request, segments[2]);
    throw new ApiError(404, "Not found");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: { slug?: string[] } }) {
  const segments = routeSegments(params);
  try {
    if (segments.length === 4 && segments[0] === "orders" && segments[2] === "status") return await handleOrderStatusUpdate(request, segments[1]);
    throw new ApiError(404, "Not found");
  } catch (err) {
    return handleApiError(err);
  }
}
