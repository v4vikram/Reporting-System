import * as projectRepository from './project.repository';

export const getProjects = async (clientId: string, query: any) => {
  const { page = 1, limit = 10, search = '', status } = query;
  
  const filter: any = { clientId };
  
  if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const projects = await projectRepository.getProjects(filter, skip, Number(limit));
  const total = await projectRepository.countProjects(filter);

  return {
    projects,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit))
  };
};

export const createProject = async (projectData: any) => {
  return await projectRepository.createProject(projectData);
};

export const updateProject = async (id: string, clientId: string, updateData: any) => {
  const project = await projectRepository.findOneAndUpdateProject(
    { _id: id, clientId },
    updateData
  );
  if (!project) throw new Error('Project not found or unauthorized');
  return project;
};

export const deleteProject = async (id: string, clientId: string) => {
  const project = await projectRepository.findOneAndDeleteProject({ _id: id, clientId });
  if (!project) throw new Error('Project not found or unauthorized');
  return project;
};
