import { Router } from 'express';
import { createReport, deleteReport, exportReport, getReport, listReports } from '../controllers/reports.controller.js';
import { allowRoles } from '../middlewares/role.middleware.js';

const router = Router();
router.get('/', listReports);
router.post('/', allowRoles('ADMIN'), createReport);
router.get('/:reportId', getReport);
router.get('/:reportId/export/:format', exportReport);
router.delete('/:reportId', allowRoles('ADMIN'), deleteReport);
export default router;
