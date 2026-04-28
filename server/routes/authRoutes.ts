import express from 'express';
import * as authController from '../controllers/authController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', requireAuth, authController.getCurrentUser);
router.get('/users', requireAuth, requireRole(['super_admin']), authController.getUsers);
router.post('/users', requireAuth, requireRole(['super_admin']), authController.createManagedUser);
router.put('/users/:id', requireAuth, requireRole(['super_admin']), authController.updateManagedUser);
router.delete('/users/:id', requireAuth, requireRole(['super_admin']), authController.deleteManagedUser);
router.get('/clients', requireAuth, requireRole(['super_admin', 'employee']), authController.getClients);
router.get('/employees', requireAuth, requireRole(['super_admin', 'employee']), authController.getEmployees);

export default router;
