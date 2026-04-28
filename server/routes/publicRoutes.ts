import express from 'express';
import * as publicController from '../controllers/publicController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// Public route - anyone can view content by clientId
router.get('/:clientId', publicController.getPublicContentByClient);

// Protected route - only admins/employees can manage public content
router.post('/', requireAuth, requireRole(['super_admin', 'employee']), publicController.createPublicContent);

export default router;
