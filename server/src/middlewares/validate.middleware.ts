import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/appError';

export const validate = (schema: ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: any) => `${err.path.join('.').replace('body.', '').replace('query.', '').replace('params.', '')}: ${err.message}`).join(', ');
        return next(new AppError(`Validation failed - ${errorMessages}`, 400));
      }
      next(error);
    }
  };
