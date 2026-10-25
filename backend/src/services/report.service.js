import { prisma } from '../config/prisma.js';

export function reportWhere(user) {
  if (user.role === 'ADMIN') return {};
  return { status: 'PUBLISHED', OR: [{ visibility: 'ALL_USERS' }, { ownerUserId: user.id }] };
}

export async function getReportForUser(id, user) {
  return prisma.report.findFirst({
    where: { id, ...reportWhere(user) },
    include: { rows: { orderBy: { createdAt: 'asc' } }, createdBy: { select: { fullName: true } } },
  });
}
