import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
});
export const getClientsSchema = z.object({
  page: z.number().gt(0).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});
export const getClientSchema = z.object({ id: z.string().uuid() });
export const updateClientSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  id: z.string().uuid(),
});
