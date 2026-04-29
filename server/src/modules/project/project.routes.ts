import express from 'express';
import * as projectController from './project.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProjectSchema, updateProjectSchema } from './project.validation';

const router = express.Router();

router.use(requireAuth); // All project routes require authentication

router.get('/', projectController.getProjects);
router.post('/', validate(createProjectSchema), projectController.createProject);
router.put('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
