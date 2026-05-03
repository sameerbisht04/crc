import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requireApprovedPartner, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

type LiveTrackingPoint = {
  latitude: number;
  longitude: number;
  updatedAt: string;
  partnerId: string;
};

let trackingTableReady = false;

async function ensureTrackingTable() {
  if (trackingTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OrderTrackingPoint" (
      "id" TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "partnerId" TEXT NOT NULL,
      "latitude" DOUBLE PRECISION NOT NULL,
      "longitude" DOUBLE PRECISION NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT "OrderTrackingPoint_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OrderTrackingPoint_orderId_createdAt_idx"
    ON "OrderTrackingPoint" ("orderId", "createdAt");
  `);
  trackingTableReady = true;
}

const createOrderSchema = z.object({
  type: z.enum(['FOOD', 'GROCERIES', 'PARCEL']),
  pickupLocation: z.string().min(1),
  dropLocation: z.string().min(1),
  notes: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'COD']),
  amount: z.number().int().min(0).optional()
});

router.post('/', authMiddleware, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const studentId = req.user!.id;
    const order = await prisma.order.create({
      data: {
        type: data.type,
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        notes: data.notes ?? null,
        paymentMethod: data.paymentMethod,
        status: 'PENDING',
        studentId,
        amount: data.amount ?? 0
      }
    });
    const io = req.app.get('io');
    io.to(`order:${order.id}`).emit('order:update', order);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', authMiddleware, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { studentId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { partner: true }
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/available', authMiddleware, requireRole('PARTNER'), requireApprovedPartner, async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'PENDING', partnerId: null },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true, email: true } } }
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/:orderId', authMiddleware, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { student: { select: { name: true, email: true } }, partner: { select: { name: true, phone: true } } }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const u = req.user!;
    const allowed = u.role === 'ADMIN' || order.studentId === u.id || order.partnerId === u.id;
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.get('/:orderId/tracking', authMiddleware, async (req, res, next) => {
  try {
    await ensureTrackingTable();
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const u = req.user!;
    const allowed = u.role === 'ADMIN' || order.studentId === u.id || order.partnerId === u.id;
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const historyRows = await prisma.$queryRaw<
      Array<{ latitude: number; longitude: number; createdAt: Date; partnerId: string }>
    >`
      SELECT "latitude", "longitude", "createdAt", "partnerId"
      FROM "OrderTrackingPoint"
      WHERE "orderId" = ${order.id}
      ORDER BY "createdAt" DESC
      LIMIT 20
    `;
    const history = historyRows.map((row) => ({
      latitude: row.latitude,
      longitude: row.longitude,
      updatedAt: row.createdAt.toISOString(),
      partnerId: row.partnerId
    }));
    res.json({
      orderId: order.id,
      status: order.status,
      tracking: history[0] ?? null,
      history
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:orderId/tracking-location', authMiddleware, async (req, res, next) => {
  try {
    await ensureTrackingTable();
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const u = req.user!;
    const canUpdate = u.role === 'ADMIN' || (u.role === 'PARTNER' && order.partnerId === u.id);
    if (!canUpdate) return res.status(403).json({ error: 'Forbidden' });

    if (order.status !== 'PICKED_UP' && order.status !== 'ON_THE_WAY') {
      return res.status(400).json({ error: 'Live tracking is available only for active deliveries' });
    }

    const { latitude, longitude } = locationSchema.parse(req.body);
    const point: LiveTrackingPoint = {
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
      partnerId: order.partnerId ?? u.id
    };
    await prisma.$executeRaw`
      INSERT INTO "OrderTrackingPoint" ("id", "orderId", "partnerId", "latitude", "longitude", "createdAt")
      VALUES (${`${order.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}, ${order.id}, ${point.partnerId}, ${point.latitude}, ${point.longitude}, NOW())
    `;
    const io = req.app.get('io');
    io.to(`order:${order.id}`).emit('order:tracking', { orderId: order.id, tracking: point });
    res.json({ orderId: order.id, tracking: point });
  } catch (err) {
    next(err);
  }
});

router.patch('/:orderId/status', authMiddleware, async (req, res, next) => {
  try {
    const statusSchema = z.object({ status: z.enum(['PENDING', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']) });
    const { status } = statusSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const u = req.user!;
    const canUpdate = u.role === 'ADMIN' || order.partnerId === u.id;
    if (!canUpdate) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.order.update({ where: { id: req.params.orderId }, data: { status } });
    if (status === 'DELIVERED' && order.partnerId) {
      await prisma.partner.update({
        where: { id: order.partnerId },
        data: { earnings: { increment: order.amount } }
      });
    }
    const io = req.app.get('io');
    io.to(`order:${updated.id}`).emit('order:update', updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;


