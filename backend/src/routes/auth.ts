import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev';

const registerSchema = z.object({
  email: z.string().email(),
  studentId: z.string().min(4),
  password: z.string().min(6),
  name: z.string().min(1)
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, studentId, password, name } = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, studentId, passwordHash, name, role: 'STUDENT' } });
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, studentId: user.studentId }
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, studentId: user.studentId }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/partner-login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const partner = await prisma.partner.findUnique({ where: { email } });
    if (!partner) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, partner.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (!partner.approved) return res.status(403).json({ error: 'Partner not approved yet' });
    const token = jwt.sign({ sub: partner.id, role: 'PARTNER' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: partner.id, email: partner.email, name: partner.name, role: 'PARTNER' as const }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'PARTNER') {
      const partner = await prisma.partner.findUnique({ where: { id: req.user.id } });
      if (!partner) return res.status(404).json({ error: 'Partner not found' });
      return res.json({ id: partner.id, email: partner.email, name: partner.name, role: 'PARTNER' as const, approved: partner.approved, earnings: partner.earnings });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, studentId: user.studentId });
  } catch (err) {
    next(err);
  }
});

export default router;


