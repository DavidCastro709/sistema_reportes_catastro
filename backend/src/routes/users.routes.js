import { Router } from 'express';
import { activateUser, createUser, deactivateUser, listUsers } from '../controllers/users.controller.js';
import { allowRoles } from '../middlewares/role.middleware.js';

const router = Router();
router.get('/', allowRoles('ADMIN'), listUsers);
router.post('/', allowRoles('ADMIN'), createUser);
router.patch('/:userId/activate', allowRoles('ADMIN'), activateUser);
router.patch('/:userId/deactivate', allowRoles('ADMIN'), deactivateUser);
export default router;
