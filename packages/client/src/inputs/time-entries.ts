import { z } from 'zod';

export const createTimeEntrySchema = z.object({
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  note: z.string().optional(),
  projectId: z.string().uuid(),
});
export const getTimeEntriesSchema = z.object({
  page: z.number().gt(0).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export const getTimeEntrySchema = z.object({ id: z.string().uuid() });
export const updateTimeEntrySchema = z.object({
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  note: z.string().optional(),
  id: z.string().uuid(),
});
export const deleteTimeEntrySchema = z.object({ id: z.string().uuid() });
export const bulkCreateTimeEntriesSchema = z.object({
  entries: z
    .array(
      z.object({
        startedAt: z.string().datetime(),
        endedAt: z.string().datetime(),
        note: z.string(),
        projectId: z.string().uuid(),
      }),
    )
    .optional(),
});
export const bulkDeleteTimeEntriesSchema = z.object({
  ids: z.array(z.string().uuid()),
});
export const bulkUpdateTimeEntriesSchema = z.object({
  ids: z.array(z.string().uuid()),
  updates: z
    .object({ note: z.string(), projectId: z.string().uuid().optional() })
    .optional(),
});
