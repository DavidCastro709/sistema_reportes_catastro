import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const pagination = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });

export async function listAuditLogs(req, res) {
  const { page, limit } = pagination.parse(req.query);
  const where = {};
  if (req.query.actorId) where.actorId = String(req.query.actorId);
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { actor: { select: { id: true, fullName: true, email: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  return res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
}
