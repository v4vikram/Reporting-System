import PublicContent from './public.model';

export const findPublicContentByClient = async (clientId: string) => {
  return await PublicContent.find({ clientId, isActive: true });
};

export const createPublicContent = async (data: any, clientId: string) => {
  const content = new PublicContent({
    ...data,
    clientId
  });
  return await content.save();
};
