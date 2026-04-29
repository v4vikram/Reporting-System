import * as publicRepository from './public.repository';

export const getPublicContentByClient = async (clientId: string) => {
  return await publicRepository.findPublicContentByClient(clientId);
};

export const createPublicContent = async (data: any, clientId: string) => {
  return await publicRepository.createPublicContent(data, clientId);
};
