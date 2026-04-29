import { Request, Response } from 'express';
import * as publicService from './public.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/responseHandler';

export const getPublicContentByClient = asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const content = await publicService.getPublicContentByClient(clientId);
  sendResponse(res, 200, content, 'Public content fetched');
});

export const createPublicContent = asyncHandler(async (req: any, res: Response) => {
  const content = await publicService.createPublicContent(req.body, req.user.clientId);
  sendResponse(res, 201, content, 'Public content created');
});
