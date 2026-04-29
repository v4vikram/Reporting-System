import { Response } from 'express';

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export const sendResponse = (
  res: Response,
  statusCode: number,
  data: any,
  message: string = 'Success',
  pagination?: Pagination
) => {
  const response: any = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
};
