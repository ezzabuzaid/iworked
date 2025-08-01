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
export const getDashboardSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});
export const getTimeAnalyticsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});
export const getProductivityMetricsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});
export const exportTimeEntriesSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  clientId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});
export const exportInvoicesSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID']).optional(),
  clientId: z.string().uuid().optional(),
});
export const exportClientTimeEntriesSchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export const exportProjectTimeEntriesSchema = z.object({
  projectId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export const exportClientProjectsTimeEntriesSchema = z.object({
  projectIds: z.array(z.string().uuid()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  clientId: z.string().uuid(),
});
