import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

router.get('/me/orders', authMiddleware, requireRole('PARTNER'), async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { partnerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true, email: true } } }
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.post('/apply', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
      phone: z.string().min(1),
      password: z.string().min(6)
    });
    const { email, name, phone, password } = schema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const partner = await prisma.partner.create({ data: { email, name, phone, passwordHash } });
    res.json({ id: partner.id, email: partner.email, name: partner.name, approved: partner.approved });
  } catch (err) {
    next(err);
  }
});

router.post('/accept/:orderId', authMiddleware, requireRole('PARTNER'), async (req, res, next) => {
  try {
    const partnerId = req.user!.id;
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.partnerId) return res.status(400).json({ error: 'Order already accepted' });
    if (order.status !== 'PENDING') return res.status(400).json({ error: 'Order not available' });
    const updated = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { partnerId, status: 'PICKED_UP' }
    });
    const io = req.app.get('io');
    io.to(`order:${updated.id}`).emit('order:update', updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;


