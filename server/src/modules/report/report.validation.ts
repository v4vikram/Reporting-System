import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project is required'),
    clientId: z.string().min(1, 'Client is required'),
    title: z.string().min(1, 'Title is required'),
    month: z.string().min(1, 'Month is required'),
    date: z.string().optional(),
    time: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    assignedTo: z.string().optional(),
  }),
});

export const updateReportSchema = z.object({
  body: z.object({
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    title: z.string().min(1, 'Title is required').optional(),
    month: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    assignedTo: z.string().optional(),
    coverPages: z.array(z.object({
      content: z.string().optional(),
      image: z.string().optional(),
    })).optional(),
  }),
});

export const createSectionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Section name is required'),
    title: z.string().optional(),
    type: z.enum(['standard', 'custom']).optional(),
    content: z.string().optional(),
    image: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const createTableSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    category: z.string().optional().nullable(),
    rows: z.array(z.any()).optional(),
  }),
});
