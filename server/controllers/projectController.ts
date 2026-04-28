import { Request, Response } from 'express';
import * as projectService from '../services/projectService';

export const getProjects = async (req: any, res: Response) => {
  try {
    const result = await projectService.getProjects(req.user.clientId, req.query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createProject = async (req: any, res: Response) => {
  try {
    const projectData = {
      ...req.body,
      clientId: req.user.clientId,
      createdBy: req.user.id
    };
    const project = await projectService.createProject(projectData);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateProject = async (req: any, res: Response) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.user.clientId, req.body);
    res.json(project);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteProject = async (req: any, res: Response) => {
  try {
    await projectService.deleteProject(req.params.id, req.user.clientId);
    res.json({ message: 'Project deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
