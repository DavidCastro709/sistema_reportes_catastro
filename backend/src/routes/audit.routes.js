import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { allowRoles } from '../middlewares/role.middleware.js';

const router = Router();
router.get('/', allowRoles('ADMIN'), listAuditLogs);
export default router;
