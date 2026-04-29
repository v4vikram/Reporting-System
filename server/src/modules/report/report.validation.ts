import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    title: z.string().min(3, 'Title is required and must be at least 3 characters long'),
    description: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }),
});

export const updateReportSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required and must be at least 3 characters long').optional(),
    description: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }),
});

export const createSectionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['table', 'text', 'image']),
    content: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const createTableSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    category: z.string().optional().nullable(),
    rows: z.array(z.any()).optional(),
  }),
});
