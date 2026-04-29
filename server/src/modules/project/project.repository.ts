import Project from './project.model';

export const findProjectsByRole = async (userRole: string, userId: string) => {
  if (userRole === 'client') {
    return await Project.find({ client: userId }).populate('client').lean();
  }
  return await Project.find().populate('client').lean();
};

export const getProjects = async (filter: any, skip: number, limit: number) => {
  return await Project.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email')
    .lean();
};

export const countProjects = async (filter: any) => {
  return await Project.countDocuments(filter);
};

export const createProject = async (data: any) => {
  const project = new Project(data);
  return await project.save();
};

export const updateProjectById = async (id: string, data: any) => {
  return await Project.findByIdAndUpdate(id, data, { new: true });
};

export const findOneAndUpdateProject = async (query: any, data: any) => {
  return await Project.findOneAndUpdate(query, data, { new: true });
};

export const deleteProjectById = async (id: string) => {
  return await Project.findByIdAndDelete(id);
};

export const findOneAndDeleteProject = async (query: any) => {
  return await Project.findOneAndDelete(query);
};
