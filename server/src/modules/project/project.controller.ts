import { Request, Response } from 'express';
import * as projectService from './project.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/responseHandler';

export const getProjects = asyncHandler(async (req: any, res: Response) => {
  const result = await projectService.getProjects(req.user.clientId, req.query);
  sendResponse(res, 200, result, 'Projects fetched');
});

export const createProject = asyncHandler(async (req: any, res: Response) => {
  const projectData = {
    ...req.body,
    clientId: req.user.clientId,
    createdBy: req.user.id
  };
  const project = await projectService.createProject(projectData);
  sendResponse(res, 201, project, 'Project created');
});

export const updateProject = asyncHandler(async (req: any, res: Response) => {
  const project = await projectService.updateProject(req.params.id, req.user.clientId, req.body);
  sendResponse(res, 200, project, 'Project updated');
});

export const deleteProject = asyncHandler(async (req: any, res: Response) => {
  await projectService.deleteProject(req.params.id, req.user.clientId);
  sendResponse(res, 200, null, 'Project deleted successfully');
});
