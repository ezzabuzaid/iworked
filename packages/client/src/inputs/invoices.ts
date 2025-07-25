import { z } from 'zod';

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
});
export const getInvoicesSchema = z.object({
  page: z.number().gt(0).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'SENT', 'PAID']).optional(),
  clientId: z.string().uuid().optional(),
});
export const getInvoiceSchema = z.object({ id: z.string().uuid() });
export const deleteInvoiceSchema = z.object({ id: z.string().uuid() });
export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['SENT', 'PAID']).optional(),
  paidAmount: z.number().gt(0).optional(),
  id: z.string().uuid(),
});
export const generateInvoicePdfSchema = z.object({ id: z.string().uuid() });
