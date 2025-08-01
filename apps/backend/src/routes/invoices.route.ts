import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { Prisma } from '@iworked/db';
import { prisma } from '@iworked/db';

import { getNextInvoiceNumber } from '../core/invoice-numbering.ts';
import { authenticated } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi createInvoice
   * @tags invoices
   * @description Create a draft invoice from time entries for a client within a date range.
   */
  router.post(
    '/api/invoices',
    authenticated(),
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
      await prisma.client.findUniqueOrThrow({
        where: {
          id: clientId,
          userId: c.var.subject.id,
        },
      });

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

      const result = await prisma.$transaction(async (tx) => {
        // Generate invoice number
        const invoiceNumber = await getNextInvoiceNumber(c.var.subject.id);

        // Create the invoice
        const invoice = await tx.invoice.create({
          data: {
            status: 'DRAFT',
            invoiceNumber,
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
    authenticated(),
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
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const invoice = await prisma.invoice.findUniqueOrThrow({
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
    authenticated(),
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
      const existingInvoice = await prisma.invoice.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

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
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Check if invoice exists and belongs to user
      await prisma.invoice.findUniqueOrThrow({
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
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Check if invoice exists and belongs to user
      const existingInvoice = await prisma.invoice.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          invoiceLines: true,
        },
      });

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

  /**
   * @openapi updateInvoice
   * @tags invoices
   * @description Update invoice details (DRAFT status only).
   */
  router.patch(
    '/api/invoices/:id',
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      dateFrom: {
        select: payload.body.dateFrom,
        against: z.string().datetime().optional(),
      },
      dateTo: {
        select: payload.body.dateTo,
        against: z.string().datetime().optional(),
      },
    })),
    async (c) => {
      const { id, dateFrom, dateTo } = c.var.input;

      // Check if invoice exists and belongs to user
      const existingInvoice = await prisma.invoice.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          invoiceLines: true,
        },
      });

      // Only allow editing of draft invoices
      if (existingInvoice.status !== 'DRAFT') {
        throw new HTTPException(400, {
          message: 'Only draft invoices can be edited',
          cause: {
            code: 'api/invoice-not-editable',
            detail: 'Invoice must be in DRAFT status to be edited',
          },
        });
      }

      const updateData: Prisma.InvoiceUpdateInput = {};

      if (dateFrom !== undefined) {
        updateData.dateFrom = new Date(dateFrom);
      }
      if (dateTo !== undefined) {
        updateData.dateTo = new Date(dateTo);
      }

      // Validate date range if both dates are provided or being updated
      const newDateFrom = dateFrom
        ? new Date(dateFrom)
        : existingInvoice.dateFrom;
      const newDateTo = dateTo ? new Date(dateTo) : existingInvoice.dateTo;

      if (newDateTo <= newDateFrom) {
        throw new HTTPException(400, {
          message: 'End date must be after start date',
          cause: {
            code: 'api/invalid-date-range',
            detail: 'dateTo must be greater than dateFrom',
          },
        });
      }

      if (Object.keys(updateData).length === 0) {
        return c.json(existingInvoice);
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
   * @openapi updateInvoiceLine
   * @tags invoices
   * @description Update an invoice line (DRAFT invoice only).
   */
  router.patch(
    '/api/invoices/:id/lines/:lineId',
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      lineId: {
        select: payload.params.lineId,
        against: z.string().uuid(),
      },
      description: {
        select: payload.body.description,
        against: z.string().min(1).max(255).optional(),
      },
      hours: {
        select: payload.body.hours,
        against: z.coerce.number().positive().optional(),
      },
      rate: {
        select: payload.body.rate,
        against: z.coerce.number().positive().optional(),
      },
    })),
    async (c) => {
      const { id, lineId, description, hours, rate } = c.var.input;

      // Check if invoice exists, belongs to user, and is draft
      await prisma.invoice.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
          status: 'DRAFT',
        },
      });

      // Check if invoice line exists and belongs to this invoice
      const existingLine = await prisma.invoiceLine.findUniqueOrThrow({
        where: {
          id: lineId,
          invoiceId: id,
        },
      });

      const updateData: Prisma.InvoiceLineUpdateInput = {};

      if (description !== undefined) updateData.description = description;
      if (hours !== undefined) updateData.hours = hours.toString();
      if (rate !== undefined) updateData.rate = rate.toString();

      // Calculate new amount if hours or rate changed
      const newHours =
        hours !== undefined ? hours : parseFloat(existingLine.hours.toString());
      const newRate =
        rate !== undefined ? rate : parseFloat(existingLine.rate.toString());
      const newAmount = Math.round(newHours * newRate * 100) / 100;

      if (hours !== undefined || rate !== undefined) {
        updateData.amount = newAmount.toString();
      }

      if (Object.keys(updateData).length === 0) {
        return c.json(existingLine);
      }

      const invoiceLine = await prisma.invoiceLine.update({
        where: { id: lineId },
        data: updateData,
        include: {
          project: true,
        },
      });

      return c.json(invoiceLine);
    },
  );

  /**
   * @openapi addInvoiceLine
   * @tags invoices
   * @description Add a new line to a draft invoice.
   */
  router.post(
    '/api/invoices/:id/lines',
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      description: {
        select: payload.body.description,
        against: z.string().min(1).max(255),
      },
      hours: {
        select: payload.body.hours,
        against: z.coerce.number().positive(),
      },
      rate: {
        select: payload.body.rate,
        against: z.coerce.number().positive(),
      },
      projectId: {
        select: payload.body.projectId,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id, description, hours, rate, projectId } = c.var.input;

      // Check if invoice exists, belongs to user, and is draft
      await prisma.invoice.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
          status: 'DRAFT',
        },
      });

      // Verify project exists and belongs to user
      await prisma.project.findUniqueOrThrow({
        where: {
          id: projectId,
          userId: c.var.subject.id,
        },
      });

      const amount = Math.round(hours * rate * 100) / 100;

      const invoiceLine = await prisma.invoiceLine.create({
        data: {
          description,
          hours: hours.toString(),
          rate: rate.toString(),
          amount: amount.toString(),
          invoiceId: id,
          projectId,
        },
        include: {
          project: true,
        },
      });

      return c.json(invoiceLine, 201);
    },
  );

  /**
   * @openapi deleteInvoiceLine
   * @tags invoices
   * @description Remove a line from a draft invoice.
   */
  router.delete(
    '/api/invoices/:id/lines/:lineId',
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      lineId: {
        select: payload.params.lineId,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id, lineId } = c.var.input;

      // Check if invoice exists, belongs to user, and is draft
      await prisma.invoice.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
          status: 'DRAFT',
        },
      });

      // Check if invoice line exists and belongs to this invoice
      await prisma.invoiceLine.findUniqueOrThrow({
        where: {
          id: lineId,
          invoiceId: id,
        },
      });

      await prisma.invoiceLine.delete({
        where: { id: lineId },
      });

      return c.json({ message: 'Invoice line deleted successfully' });
    },
  );
}
