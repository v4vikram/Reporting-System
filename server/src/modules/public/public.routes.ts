import express from 'express';
import * as publicController from './public.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createPublicContentSchema } from './public.validation';

const router = express.Router();

// Public route - anyone can view content by clientId
router.get('/:clientId', publicController.getPublicContentByClient);

// Protected route - only admins/employees can manage public content
router.post('/', requireAuth, requireRole(['super_admin', 'employee']), validate(createPublicContentSchema), publicController.createPublicContent);

export default router;
