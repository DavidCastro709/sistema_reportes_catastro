import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { recordAudit } from '../services/audit.service.js';
import { reportWhere, getReportForUser } from '../services/report.service.js';
import { buildReportExcel } from '../services/excel.service.js';
import { streamReportPdf } from '../services/pdf.service.js';

const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
const createSchema = z.object({ title: z.string().trim().min(2).max(180), folio: z.string().trim().regex(/^[A-Za-z0-9._-]{2,40}$/, 'El folio solo acepta letras, números, punto, guion y guion bajo'), visibility: z.enum(['ALL_USERS', 'OWNER_ONLY']).default('ALL_USERS'), ownerUserId: z.string().cuid().optional(), parameters: z.record(z.unknown()).default({}), rows: z.array(z.object({ cadastralId: z.string().min(1).max(80), description: z.string().min(1).max(240), amount: z.coerce.number().finite().nonnegative(), income: z.coerce.number().finite().nonnegative().default(0) })).max(5000).default([]), publish: z.boolean().default(true) });

export async function listReports(req, res) {
  const { page, limit } = listSchema.parse(req.query);
  const where = reportWhere(req.user);
  const [items, total] = await prisma.$transaction([
    prisma.report.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, title: true, folio: true, status: true, createdAt: true, createdBy: { select: { fullName: true } }, _count: { select: { rows: true } } } }),
    prisma.report.count({ where }),
  ]);
  return res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
}

export async function createReport(req, res) {
  const input = createSchema.parse(req.body);
  if (input.visibility === 'OWNER_ONLY' && !input.ownerUserId) return res.status(400).json({ error: 'ownerUserId es obligatorio para reportes privados' });
  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.report.create({ data: { title: input.title, folio: input.folio, status: input.publish ? 'PUBLISHED' : 'DRAFT', visibility: input.visibility, ownerUserId: input.ownerUserId, parameters: input.parameters, createdById: req.user.id, rows: { create: input.rows } }, include: { rows: true } });
    await recordAudit(tx, { actorId: req.user.id, action: 'REPORT_CREATED', entity: 'Report', entityId: created.id, newValues: { title: created.title, folio: created.folio, status: created.status, visibility: created.visibility, rowCount: created.rows.length }, ipAddress: req.ip });
    return created;
  });
  return res.status(201).json({ report });
}

export async function deleteReport(req, res) {
  const reportId = req.params.reportId;
  const deleted = await prisma.$transaction(async (tx) => {
    const report = await tx.report.findUniqueOrThrow({
      where: { id: reportId },
      include: { rows: true },
    });
    await tx.report.delete({ where: { id: reportId } });
    await recordAudit(tx, {
      actorId: req.user.id,
      action: 'REPORT_DELETED',
      entity: 'Report',
      entityId: reportId,
      oldValues: { title: report.title, folio: report.folio, status: report.status, visibility: report.visibility, rowCount: report.rows.length },
      newValues: null,
      ipAddress: req.ip,
    });
    return report;
  });
  return res.json({ deleted: { id: deleted.id, title: deleted.title, folio: deleted.folio } });
}

export async function getReport(req, res) {
  const report = await getReportForUser(req.params.reportId, req.user);
  if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
  return res.json({ report });
}

export async function exportReport(req, res) {
  if (!['pdf', 'excel'].includes(req.params.format)) return res.status(400).json({ error: 'Formato permitido: pdf o excel' });
  const report = await getReportForUser(req.params.reportId, req.user);
  if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
  await recordAudit(prisma, { actorId: req.user.id, action: `REPORT_EXPORTED_${req.params.format.toUpperCase()}`, entity: 'Report', entityId: report.id, newValues: { folio: report.folio }, ipAddress: req.ip });
  if (req.params.format === 'pdf') return streamReportPdf(report, res);
  if (req.params.format === 'excel') {
    const buffer = await buildReportExcel(report);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${report.folio}.xlsx"`);
    return res.send(Buffer.from(buffer));
  }
  return res.status(400).json({ error: 'Formato permitido: pdf o excel' });
}
