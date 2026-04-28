import Project from '../models/Project';

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
  
  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('createdBy', 'name email');

  const total = await Project.countDocuments(filter);

  return {
    projects,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit))
  };
};

export const createProject = async (projectData: any) => {
  const project = new Project(projectData);
  await project.save();
  return project;
};

export const updateProject = async (id: string, clientId: string, updateData: any) => {
  const project = await Project.findOneAndUpdate(
    { _id: id, clientId },
    updateData,
    { new: true }
  );
  if (!project) throw new Error('Project not found or unauthorized');
  return project;
};

export const deleteProject = async (id: string, clientId: string) => {
  const project = await Project.findOneAndDelete({ _id: id, clientId });
  if (!project) throw new Error('Project not found or unauthorized');
  return project;
};
