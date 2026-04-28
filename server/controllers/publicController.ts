import { Request, Response } from 'express';
import PublicContent from '../models/PublicContent';

export const getPublicContentByClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const content = await PublicContent.find({ clientId, isActive: true });
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createPublicContent = async (req: any, res: Response) => {
  try {
    const content = new PublicContent({
      ...req.body,
      clientId: req.user.clientId
    });
    await content.save();
    res.status(201).json(content);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
