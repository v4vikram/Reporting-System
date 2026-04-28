import api from '../../../api/axios';
import { Project } from '../../../types/index.ts';

export const projectService = {
  getProjects: async (params: { page?: number; limit?: number; search?: string }) => {
    const { data } = await api.get<{ projects: Project[]; total: number; pages: number }>('/projects', { params });
    return data;
  },
  getProjectById: async (id: string) => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },
  createProject: async (projectData: Partial<Project>) => {
    const { data } = await api.post<Project>('/projects', projectData);
    return data;
  },
  updateProject: async (id: string, projectData: Partial<Project>) => {
    const { data } = await api.put<Project>(`/projects/${id}`, projectData);
    return data;
  },
  deleteProject: async (id: string) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  }
};
