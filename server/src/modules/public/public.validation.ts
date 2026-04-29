import { z } from 'zod';

export const createPublicContentSchema = z.object({
  body: z.object({
    theme: z.object({
      primaryColor: z.string().optional(),
      logoUrl: z.string().optional(),
    }).optional(),
    domain: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});
