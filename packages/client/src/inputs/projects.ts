import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  hourlyRate: z.number().gt(0).optional(),
  clientId: z.string().uuid(),
});
export const getProjectsSchema = z.object({
  page: z.number().gt(0).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  clientId: z.string().uuid().optional(),
});
export const getProjectSchema = z.object({ id: z.string().uuid() });
export const updateProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  hourlyRate: z.number().gt(0).optional(),
  id: z.string().uuid(),
});
