import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

router.use(authMiddleware, requireRole('ADMIN'));

router.get('/stats', async (_req, res, next) => {
  try {
    const [ordersToday, totalEarnings] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: new Date(new Date().toDateString()) } } }),
      prisma.order.aggregate({ _sum: { amount: true } })
    ]);
    res.json({ ordersToday, totalEarnings: totalEarnings._sum.amount || 0 });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true, email: true } }, partner: { select: { name: true } } }
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/partners/pending', async (_req, res, next) => {
  try {
    const partners = await prisma.partner.findMany({ where: { approved: false } });
    res.json(partners);
  } catch (err) {
    next(err);
  }
});

router.post('/partners/:partnerId/approve', async (req, res, next) => {
  try {
    const partner = await prisma.partner.update({ where: { id: req.params.partnerId }, data: { approved: true } });
    res.json(partner);
  } catch (err) {
    next(err);
  }
});

export default router;


