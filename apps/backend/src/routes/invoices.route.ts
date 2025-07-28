import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { Prisma } from '@iworked/db';
import { prisma } from '@iworked/db';

import { verifyToken } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi createInvoice
   * @tags invoices
   * @description Create a draft invoice from time entries for a client within a date range.
   */
  router.post(
    '/api/invoices',
    verifyToken(),
    validate((payload) => ({
      clientId: {
        select: payload.body.clientId,
        against: z.string().uuid(),
      },
      dateFrom: {
        select: payload.body.dateFrom,
        against: z.string().datetime(),
      },
      dateTo: {
        select: payload.body.dateTo,
        against: z.string().datetime(),
      },
    })),
    async (c) => {
      const { clientId, dateFrom, dateTo } = c.var.input;

      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      if (endDate <= startDate) {
        throw new HTTPException(400, {
          message: 'End date must be after start date',
          cause: {
            code: 'api/invalid-date-range',
            detail: 'dateTo must be greater than dateFrom',
          },
        });
      }

      // Verify client exists and belongs to user
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: c.var.subject.id,
        },
      });

      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      // Get unlocked time entries for the client within the date range
      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          userId: c.var.subject.id,
          project: { clientId },
          isLocked: false,
          startedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          project: true,
        },
      });

      if (timeEntries.length === 0) {
        throw new HTTPException(400, {
          message:
            'No unlocked time entries found for the specified client and date range',
          cause: {
            code: 'api/no-time-entries',
            detail: 'No billable time entries available for invoicing',
          },
        });
      }

      // Group time entries by project and calculate totals
      const projectTotals = timeEntries.reduce(
        (acc, entry) => {
          const projectId = entry.project.id;
          const projectName = entry.project.name;
          const hourlyRate = entry.project.hourlyRate
            ? parseFloat(entry.project.hourlyRate.toString())
            : 0;
          const durationHours =
            (entry.endedAt.getTime() - entry.startedAt.getTime()) /
            (1000 * 60 * 60);

          if (!acc[projectId]) {
            acc[projectId] = {
              projectId,
              projectName,
              hourlyRate,
              totalHours: 0,
              timeEntryIds: [],
            };
          }

          acc[projectId].totalHours += durationHours;
          acc[projectId].timeEntryIds.push(entry.id);

          return acc;
        },
        {} as Record<string, any>,
      );

      // Create invoice in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the invoice
        const invoice = await tx.invoice.create({
          data: {
            status: 'DRAFT',
            dateFrom: startDate,
            dateTo: endDate,
            clientId,
            userId: c.var.subject.id,
          },
        });

        // Create invoice lines for each project
        const invoiceLines = await Promise.all(
          Object.values(projectTotals).map(async (project: any) => {
            const hours = Math.round(project.totalHours * 100) / 100; // Round to 2 decimal places (BR-2)
            const rate = Math.round(project.hourlyRate * 100) / 100;
            const amount = Math.round(hours * rate * 100) / 100;

            return tx.invoiceLine.create({
              data: {
                description: project.projectName,
                hours: hours.toString(),
                rate: rate.toString(),
                amount: amount.toString(),
                invoiceId: invoice.id,
                projectId: project.projectId,
              },
            });
          }),
        );

        // Lock the time entries (FR-6, FR-7)
        await tx.timeEntry.updateMany({
          where: {
            id: {
              in: timeEntries.map((entry) => entry.id),
            },
          },
          data: {
            isLocked: true,
          },
        });

        return { invoice, invoiceLines };
      });

      // Return the created invoice with lines
      const createdInvoice = await prisma.invoice.findUnique({
        where: { id: result.invoice.id },
        include: {
          client: true,
          invoiceLines: {
            include: {
              project: true,
            },
          },
        },
      });

      return c.json(createdInvoice, 201);
    },
  );

  /**
   * @openapi getInvoices
   * @tags invoices
   * @description Get a paginated list of invoices for the authenticated user.
   */
  router.get(
    '/api/invoices',
    verifyToken(),
    validate((payload) => ({
      page: {
        select: payload.query.page,
        against: z.coerce.number().int().positive().default(1),
      },
      pageSize: {
        select: payload.query.pageSize,
        against: z.coerce.number().int().min(1).max(100).default(20),
      },
      status: {
        select: payload.query.status,
        against: z.enum(['DRAFT', 'SENT', 'PAID']).optional(),
      },
      clientId: {
        select: payload.query.clientId,
        against: z.string().uuid().optional(),
      },
    })),
    async (c) => {
      const { page, pageSize, status, clientId } = c.var.input;

      const where: Prisma.InvoiceWhereInput = {
        userId: c.var.subject.id,
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
      };

      const totalCount = await prisma.invoice.count({ where });

      const invoices = await prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          client: true,
          invoiceLines: true,
        },
      });

      // Calculate totals for each invoice
      const invoicesWithTotals = invoices.map((invoice) => {
        const totalAmount = invoice.invoiceLines.reduce((sum, line) => {
          return sum + parseFloat(line.amount.toString());
        }, 0);

        return {
          ...invoice,
          totalAmount: Math.round(totalAmount * 100) / 100,
        };
      });

      return c.json({
        data: invoicesWithTotals,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      });
    },
  );

  /**
   * @openapi getInvoice
   * @tags invoices
   * @description Get a specific invoice by ID.
   */
  router.get(
    '/api/invoices/:id',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const invoice = await prisma.invoice.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          client: true,
          invoiceLines: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!invoice) {
        return c.json({ error: 'Invoice not found' }, 404);
      }

      // Calculate total amount
      const totalAmount = invoice.invoiceLines.reduce((sum, line) => {
        return sum + parseFloat(line.amount.toString());
      }, 0);

      return c.json({
        ...invoice,
        totalAmount: Math.round(totalAmount * 100) / 100,
      });
    },
  );

  /**
   * @openapi updateInvoiceStatus
   * @tags invoices
   * @description Update invoice status (forward transitions only: draft → sent → paid).
   */
  router.patch(
    '/api/invoices/:id/status',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      status: {
        select: payload.body.status,
        against: z.enum(['SENT', 'PAID']),
      },
      paidAmount: {
        select: payload.body.paidAmount,
        against: z.coerce.number().positive().optional(),
      },
    })),
    async (c) => {
      const { id, status, paidAmount } = c.var.input;

      // Check if invoice exists and belongs to user
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

      if (!existingInvoice) {
        return c.json({ error: 'Invoice not found' }, 404);
      }

      // Validate status transitions (FR-8)
      const currentStatus = existingInvoice.status;
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['SENT'],
        SENT: ['PAID'],
        PAID: [], // No transitions from PAID
      };

      if (!validTransitions[currentStatus]?.includes(status)) {
        throw new HTTPException(400, {
          message: `Invalid status transition from ${currentStatus} to ${status}`,
          cause: {
            code: 'api/invalid-status-transition',
            detail: `Status can only transition forward: DRAFT → SENT → PAID`,
          },
        });
      }

      const updateData: Prisma.InvoiceUpdateInput = {
        status,
      };

      // Set timestamps and amounts based on status (FR-9)
      if (status === 'SENT') {
        updateData.sentAt = new Date();
      } else if (status === 'PAID') {
        updateData.paidAt = new Date();
        if (paidAmount !== undefined) {
          updateData.paidAmount = paidAmount.toString();
        }
      }

      const invoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          invoiceLines: {
            include: {
              project: true,
            },
          },
        },
      });

      return c.json(invoice);
    },
  );

  /**
   * @openapi generateInvoicePdf
   * @tags invoices
   * @description Generate and get download link for invoice PDF.
   */
  router.post(
    '/api/invoices/:id/pdf',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Check if invoice exists and belongs to user
      const invoice = await prisma.invoice.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          client: true,
          invoiceLines: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!invoice) {
        return c.json({ error: 'Invoice not found' }, 404);
      }

      // For MVP, return a placeholder PDF URL (FR-10)
      // In production, this would integrate with a PDF generation service
      const pdfUrl = `https://example.com/pdfs/invoice-${id}.pdf`;

      // Update invoice with PDF URL
      await prisma.invoice.update({
        where: { id },
        data: { pdfUrl },
      });

      return c.json({
        pdfUrl,
        message: 'PDF generation initiated',
      });
    },
  );

  /**
   * @openapi deleteInvoice
   * @tags invoices
   * @description Delete a draft invoice and unlock associated time entries.
   */
  router.delete(
    '/api/invoices/:id',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Check if invoice exists and belongs to user
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          invoiceLines: true,
        },
      });

      if (!existingInvoice) {
        return c.json({ error: 'Invoice not found' }, 404);
      }

      // Only allow deletion of draft invoices
      if (existingInvoice.status !== 'DRAFT') {
        throw new HTTPException(400, {
          message: 'Only draft invoices can be deleted',
          cause: {
            code: 'api/invoice-not-deletable',
            detail: 'Invoice must be in DRAFT status to be deleted',
          },
        });
      }

      // Get time entries that were locked by this invoice
      const projectIds = existingInvoice.invoiceLines.map(
        (line) => line.projectId,
      );
      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          userId: c.var.subject.id,
          projectId: { in: projectIds },
          isLocked: true,
          startedAt: {
            gte: existingInvoice.dateFrom,
            lte: existingInvoice.dateTo,
          },
        },
      });

      // Delete invoice and unlock time entries in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete invoice (this will cascade delete invoice lines)
        await tx.invoice.delete({
          where: { id },
        });

        // Unlock the time entries
        await tx.timeEntry.updateMany({
          where: {
            id: {
              in: timeEntries.map((entry) => entry.id),
            },
          },
          data: {
            isLocked: false,
          },
        });
      });

      return c.json({ message: 'Invoice deleted successfully' });
    },
  );
}
