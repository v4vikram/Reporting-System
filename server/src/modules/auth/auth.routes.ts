import express from 'express';
import * as authController from './auth.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema, createUserSchema, updateUserSchema, resetPasswordRequestSchema, resetPasswordSchema } from './auth.validation';

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(resetPasswordRequestSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', requireAuth, authController.getCurrentUser);
router.get('/users', requireAuth, requireRole(['super_admin']), authController.getUsers);
router.post('/users', requireAuth, requireRole(['super_admin']), validate(createUserSchema), authController.createManagedUser);
router.put('/users/:id', requireAuth, requireRole(['super_admin']), validate(updateUserSchema), authController.updateManagedUser);
router.delete('/users/:id', requireAuth, requireRole(['super_admin']), authController.deleteManagedUser);
router.get('/clients', requireAuth, requireRole(['super_admin', 'employee']), authController.getClients);
router.get('/employees', requireAuth, requireRole(['super_admin', 'employee']), authController.getEmployees);

export default router;
