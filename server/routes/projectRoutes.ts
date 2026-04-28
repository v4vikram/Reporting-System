import express from 'express';
import * as projectController from '../controllers/projectController';
import { requireAuth } from '../middleware/authMiddleware';
import { validateProject } from '../middleware/validationMiddleware';

const router = express.Router();

router.use(requireAuth); // All project routes require authentication

router.get('/', projectController.getProjects);
router.post('/', validateProject, projectController.createProject);
router.put('/:id', validateProject, projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
