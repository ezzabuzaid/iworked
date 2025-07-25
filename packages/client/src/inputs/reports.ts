import { z } from 'zod';

export const getSummarySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['client', 'project']),
  clientId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});
export const getDetailedReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  clientId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  page: z.number().gt(0).default(1),
  pageSize: z.number().min(1).max(100).default(50),
});
