import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '@iworked/db';

import { authenticated } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi getSummary
   * @tags reports
   * @description Get summary report of hours and amounts by client or project for a date range.
   */
  router.get(
    '/api/reports/summary',
    authenticated(),
    validate((payload) => ({
      startDate: {
        select: payload.query.startDate,
        against: z.string().datetime(),
      },
      endDate: {
        select: payload.query.endDate,
        against: z.string().datetime(),
      },
      groupBy: {
        select: payload.query.groupBy,
        against: z.enum(['client', 'project']),
      },
      clientId: {
        select: payload.query.clientId,
        against: z.string().uuid().optional(),
      },
      projectId: {
        select: payload.query.projectId,
        against: z.string().uuid().optional(),
      },
    })),
    async (c) => {
      const { startDate, endDate, groupBy, clientId, projectId } = c.var.input;

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      if (endDateTime <= startDateTime) {
        return c.json({ error: 'End date must be after start date' }, 400);
      }

      // Base query for time entries
      const whereClause = {
        userId: c.var.subject.id,
        startedAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
        ...(clientId ? { project: { clientId } } : {}),
        ...(projectId ? { projectId } : {}),
      };

      if (groupBy === 'client') {
        // Group by client
        const timeEntries = await prisma.timeEntry.findMany({
          where: whereClause,
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        });

        // Group and calculate totals
        const summary = timeEntries.reduce(
          (acc, entry) => {
            const clientId = entry.project.client!.id;
            const clientName = entry.project.client!.name;
            const durationHours =
              (entry.endedAt.getTime() - entry.startedAt.getTime()) /
              (1000 * 60 * 60);
            const hourlyRate = entry.project.hourlyRate
              ? parseFloat(entry.project.hourlyRate.toString())
              : 0;
            const amount = durationHours * hourlyRate;

            if (!acc[clientId]) {
              acc[clientId] = {
                id: clientId,
                name: clientName,
                totalHours: 0,
                totalAmount: 0,
                projects: {} as Record<
                  string,
                  { id: string; name: string; hours: number; amount: number }
                >,
              };
            }

            acc[clientId].totalHours += durationHours;
            acc[clientId].totalAmount += amount;

            // Also track project breakdown within client
            const projectId = entry.project.id;
            const projectName = entry.project.name;
            if (!acc[clientId].projects[projectId]) {
              acc[clientId].projects[projectId] = {
                id: projectId,
                name: projectName,
                hours: 0,
                amount: 0,
              };
            }
            acc[clientId].projects[projectId].hours += durationHours;
            acc[clientId].projects[projectId].amount += amount;

            return acc;
          },
          {} as Record<string, any>,
        );

        return c.json({
          groupBy: 'client',
          dateRange: { startDate, endDate },
          summary: Object.values(summary).map((client) => ({
            ...client,
            totalHours: Math.round(client.totalHours * 100) / 100, // Round to 2 decimal places
            totalAmount: Math.round(client.totalAmount * 100) / 100,
            projects: Object.values(client.projects).map((project: any) => ({
              ...project,
              hours: Math.round(project.hours * 100) / 100,
              amount: Math.round(project.amount * 100) / 100,
            })),
          })),
        });
      } else {
        // Group by project
        const timeEntries = await prisma.timeEntry.findMany({
          where: whereClause,
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        });

        // Group and calculate totals
        const summary = timeEntries.reduce(
          (acc, entry) => {
            const projectId = entry.project.id;
            const projectName = entry.project.name;
            const clientName = entry.project.client!.name;
            const durationHours =
              (entry.endedAt.getTime() - entry.startedAt.getTime()) /
              (1000 * 60 * 60);
            const hourlyRate = entry.project.hourlyRate
              ? parseFloat(entry.project.hourlyRate.toString())
              : 0;
            const amount = durationHours * hourlyRate;

            if (!acc[projectId]) {
              acc[projectId] = {
                id: projectId,
                name: projectName,
                client: {
                  id: entry.project.client!.id,
                  name: clientName,
                },
                totalHours: 0,
                totalAmount: 0,
                hourlyRate,
              };
            }

            acc[projectId].totalHours += durationHours;
            acc[projectId].totalAmount += amount;

            return acc;
          },
          {} as Record<string, any>,
        );

        return c.json({
          groupBy: 'project',
          dateRange: { startDate, endDate },
          summary: Object.values(summary).map((project) => ({
            ...project,
            totalHours: Math.round(project.totalHours * 100) / 100, // Round to 2 decimal places
            totalAmount: Math.round(project.totalAmount * 100) / 100,
          })),
        });
      }
    },
  );

  /**
   * @openapi getDetailedReport
   * @tags reports
   * @description Get detailed time entries for a specific date range with totals.
   */
  router.get(
    '/api/reports/detailed',
    authenticated(),
    validate((payload) => ({
      startDate: {
        select: payload.query.startDate,
        against: z.string().datetime(),
      },
      endDate: {
        select: payload.query.endDate,
        against: z.string().datetime(),
      },
      clientId: {
        select: payload.query.clientId,
        against: z.string().uuid().optional(),
      },
      projectId: {
        select: payload.query.projectId,
        against: z.string().uuid().optional(),
      },
      page: {
        select: payload.query.page,
        against: z.coerce.number().int().positive().default(1),
      },
      pageSize: {
        select: payload.query.pageSize,
        against: z.coerce.number().int().min(1).max(100).default(50),
      },
    })),
    async (c) => {
      const { startDate, endDate, clientId, projectId, page, pageSize } =
        c.var.input;

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const whereClause = {
        userId: c.var.subject.id,
        startedAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
        ...(clientId ? { project: { clientId } } : {}),
        ...(projectId ? { projectId } : {}),
      };

      const totalCount = await prisma.timeEntry.count({ where: whereClause });

      const timeEntries = await prisma.timeEntry.findMany({
        where: whereClause,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      // Calculate totals for all entries (not just current page)
      const allEntries = await prisma.timeEntry.findMany({
        where: whereClause,
        include: {
          project: true,
        },
      });

      const totals = allEntries.reduce(
        (acc, entry) => {
          const durationHours =
            (entry.endedAt.getTime() - entry.startedAt.getTime()) /
            (1000 * 60 * 60);
          const hourlyRate = entry.project.hourlyRate
            ? parseFloat(entry.project.hourlyRate.toString())
            : 0;
          const amount = durationHours * hourlyRate;

          acc.totalHours += durationHours;
          acc.totalAmount += amount;
          return acc;
        },
        { totalHours: 0, totalAmount: 0 },
      );

      return c.json({
        data: timeEntries.map((entry) => {
          const durationHours =
            (entry.endedAt.getTime() - entry.startedAt.getTime()) /
            (1000 * 60 * 60);
          const hourlyRate = entry.project.hourlyRate
            ? parseFloat(entry.project.hourlyRate.toString())
            : 0;
          const amount = durationHours * hourlyRate;

          return {
            ...entry,
            durationHours: Math.round(durationHours * 100) / 100,
            amount: Math.round(amount * 100) / 100,
          };
        }),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
        totals: {
          totalHours: Math.round(totals.totalHours * 100) / 100,
          totalAmount: Math.round(totals.totalAmount * 100) / 100,
        },
        dateRange: { startDate, endDate },
      });
    },
  );
}
