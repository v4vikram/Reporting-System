import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().optional(),
    status: z.enum(['pending', 'active', 'completed', 'on_hold']).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'active', 'completed', 'on_hold']).optional(),
  }),
});
