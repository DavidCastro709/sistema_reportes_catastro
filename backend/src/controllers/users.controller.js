import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { recordAudit } from '../services/audit.service.js';

const createUserSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(2).max(160),
  password: z.string().min(12).max(128),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

export async function listUsers(req, res) {
  const parsedPage = Number.parseInt(req.query.page, 10);
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isSafeInteger(parsedLimit) && parsedLimit > 0 ? Math.min(100, parsedLimit) : 25;
  const where = req.query.includeInactive === 'true' ? {} : { isActive: true };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } }),
    prisma.user.count({ where }),
  ]);
  return res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
}

export async function createUser(req, res) {
  const input = createUserSchema.parse(req.body);
  const email = input.email.toLowerCase();
  const result = await prisma.$transaction(async (tx) => {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await tx.user.create({
      data: { email, fullName: input.fullName, passwordHash, role: input.role },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    });
    await recordAudit(tx, {
      actorId: req.user.id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValues: { email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive },
      ipAddress: req.ip,
    });
    return user;
  });
  return res.status(201).json({ user: result });
}

export async function activateUser(req, res) {
  const { userId } = req.params;
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true, fullName: true, isActive: true } });
    if (current.isActive) return current;
    const updated = await tx.user.update({ where: { id: userId }, data: { isActive: true }, select: { id: true, email: true, fullName: true, isActive: true } });
    await recordAudit(tx, { actorId: req.user.id, action: 'USER_ACTIVATED', entity: 'User', entityId: userId, oldValues: current, newValues: updated, ipAddress: req.ip });
    return updated;
  });
  return res.json({ user: result });
}

export async function deactivateUser(req, res) {
  const { userId } = req.params;
  if (userId === req.user.id) return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true, isActive: true } });
    if (!current.isActive) return current;
    const updated = await tx.user.update({ where: { id: userId }, data: { isActive: false }, select: { id: true, email: true, isActive: true } });
    await recordAudit(tx, { actorId: req.user.id, action: 'USER_DEACTIVATED', entity: 'User', entityId: userId, oldValues: current, newValues: updated, ipAddress: req.ip });
    return updated;
  });
  return res.json({ user: result });
}
