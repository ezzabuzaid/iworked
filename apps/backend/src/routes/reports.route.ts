import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '@iworked/db';

import {
  calculateDurationHours,
  calculateTimeEntriesTotals,
  groupTimeEntriesByClient,
  groupTimeEntriesByProject,
  roundToTwoDecimals,
} from '../core/calculations.ts';
import {
  exportInvoicesToCSV,
  exportSummaryReportToCSV,
  exportTimeEntriesToCSV,
  getCSVHeaders,
} from '../core/export.ts';
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

  /**
   * @openapi getDashboard
   * @tags reports
   * @description Get dashboard metrics and key performance indicators.
   */
  router.get(
    '/api/reports/dashboard',
    authenticated(),
    validate((payload) => ({
      period: {
        select: payload.query.period,
        against: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
      },
    })),
    async (c) => {
      const { period } = c.var.input;
      const userId = c.var.subject.id;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(
            now.getFullYear(),
            Math.floor(now.getMonth() / 3) * 3,
            1,
          );
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get time entries for the period
      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          userId,
          startedAt: {
            gte: startDate,
            lte: now,
          },
        },
        include: {
          project: true,
        },
      });

      const totals = calculateTimeEntriesTotals(timeEntries);

      // Get invoice metrics
      const invoices = await prisma.invoice.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        include: {
          invoiceLines: true,
        },
      });

      const invoiceMetrics = invoices.reduce(
        (acc, invoice) => {
          const totalAmount = invoice.invoiceLines.reduce(
            (sum, line) => sum + parseFloat(line.amount.toString()),
            0,
          );

          acc.totalInvoiced += totalAmount;
          acc.invoicesByStatus[invoice.status] =
            (acc.invoicesByStatus[invoice.status] || 0) + 1;

          if (invoice.status === 'PAID') {
            acc.totalPaid += invoice.paidAmount
              ? parseFloat(invoice.paidAmount.toString())
              : totalAmount;
          }

          return acc;
        },
        {
          totalInvoiced: 0,
          totalPaid: 0,
          invoicesByStatus: {} as Record<string, number>,
        },
      );

      // Get active projects count
      const activeProjects = await prisma.project.count({
        where: {
          userId,
          timeEntries: {
            some: {
              startedAt: {
                gte: startDate,
                lte: now,
              },
            },
          },
        },
      });

      // Get clients count
      const activeClients = await prisma.client.count({
        where: {
          userId,
          projects: {
            some: {
              timeEntries: {
                some: {
                  startedAt: {
                    gte: startDate,
                    lte: now,
                  },
                },
              },
            },
          },
        },
      });

      return c.json({
        period,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
        metrics: {
          totalHours: totals.totalHours,
          totalAmount: totals.totalAmount,
          totalInvoiced: roundToTwoDecimals(invoiceMetrics.totalInvoiced),
          totalPaid: roundToTwoDecimals(invoiceMetrics.totalPaid),
          pendingAmount: roundToTwoDecimals(
            invoiceMetrics.totalInvoiced - invoiceMetrics.totalPaid,
          ),
          activeProjects,
          activeClients,
          timeEntriesCount: timeEntries.length,
          invoicesCount: invoices.length,
          invoicesByStatus: invoiceMetrics.invoicesByStatus,
        },
      });
    },
  );

  /**
   * @openapi getTimeAnalytics
   * @tags reports
   * @description Get time tracking analytics and patterns.
   */
  router.get(
    '/api/reports/time-analytics',
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
        against: z.enum(['day', 'week', 'month']).default('day'),
      },
    })),
    async (c) => {
      const { startDate, endDate, groupBy } = c.var.input;
      const userId = c.var.subject.id;

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          userId,
          startedAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
        orderBy: {
          startedAt: 'asc',
        },
      });

      // Group by time period
      const analytics = timeEntries.reduce(
        (acc, entry) => {
          const date = entry.startedAt;
          let key: string;

          switch (groupBy) {
            case 'week': {
              const startOfWeek = new Date(date);
              startOfWeek.setDate(date.getDate() - date.getDay());
              key = startOfWeek.toISOString().split('T')[0];
              break;
            }
            case 'month':
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              break;
            default: // day
              key = date.toISOString().split('T')[0];
          }

          if (!acc[key]) {
            acc[key] = {
              period: key,
              totalHours: 0,
              totalAmount: 0,
              entriesCount: 0,
              projects: new Set(),
              clients: new Set(),
            };
          }

          const hours = calculateDurationHours(entry.startedAt, entry.endedAt);
          const rate = entry.project.hourlyRate
            ? parseFloat(entry.project.hourlyRate.toString())
            : 0;

          acc[key].totalHours += hours;
          acc[key].totalAmount += hours * rate;
          acc[key].entriesCount += 1;
          acc[key].projects.add(entry.project.name);
          if (entry.project.client) {
            acc[key].clients.add(entry.project.client.name);
          }

          return acc;
        },
        {} as Record<string, any>,
      );

      // Convert to array and calculate averages
      const result = Object.values(analytics).map((period: any) => ({
        period: period.period,
        totalHours: roundToTwoDecimals(period.totalHours),
        totalAmount: roundToTwoDecimals(period.totalAmount),
        entriesCount: period.entriesCount,
        projectsCount: period.projects.size,
        clientsCount: period.clients.size,
        averageHoursPerEntry: roundToTwoDecimals(
          period.totalHours / period.entriesCount,
        ),
      }));

      // Calculate overall statistics
      const overallStats = {
        totalPeriods: result.length,
        averageHoursPerPeriod:
          result.length > 0
            ? roundToTwoDecimals(
                result.reduce((sum, p) => sum + p.totalHours, 0) /
                  result.length,
              )
            : 0,
        averageAmountPerPeriod:
          result.length > 0
            ? roundToTwoDecimals(
                result.reduce((sum, p) => sum + p.totalAmount, 0) /
                  result.length,
              )
            : 0,
        mostProductivePeriod: result.reduce(
          (max, current) =>
            current.totalHours > (max?.totalHours || 0) ? current : max,
          null as any,
        ),
      };

      return c.json({
        groupBy,
        dateRange: { startDate, endDate },
        analytics: result,
        statistics: overallStats,
      });
    },
  );

  /**
   * @openapi getProductivityMetrics
   * @tags reports
   * @description Get productivity metrics and insights.
   */
  router.get(
    '/api/reports/productivity',
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
    })),
    async (c) => {
      const { startDate, endDate } = c.var.input;
      const userId = c.var.subject.id;

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          userId,
          startedAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      const totalDays = Math.ceil(
        (endDateTime.getTime() - startDateTime.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const totals = calculateTimeEntriesTotals(timeEntries);

      // Calculate daily patterns
      const dailyHours = Array(7).fill(0);
      const hourlyDistribution = Array(24).fill(0);

      timeEntries.forEach((entry) => {
        const dayOfWeek = entry.startedAt.getDay();
        const hour = entry.startedAt.getHours();
        const duration = calculateDurationHours(entry.startedAt, entry.endedAt);

        dailyHours[dayOfWeek] += duration;
        hourlyDistribution[hour] += duration;
      });

      // Group by client and project for distribution
      const clientGroups = groupTimeEntriesByClient(timeEntries as any);
      const projectGroups = groupTimeEntriesByProject(timeEntries as any);

      // Calculate productivity metrics
      const metrics = {
        totalHours: totals.totalHours,
        totalAmount: totals.totalAmount,
        averageHoursPerDay: roundToTwoDecimals(totals.totalHours / totalDays),
        averageSessionDuration:
          timeEntries.length > 0
            ? roundToTwoDecimals(totals.totalHours / timeEntries.length)
            : 0,
        totalSessions: timeEntries.length,
        uniqueProjects: Object.keys(projectGroups).length,
        uniqueClients: Object.keys(clientGroups).length,

        // Time distribution
        dailyDistribution: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ].map((day, index) => ({
          day,
          hours: roundToTwoDecimals(dailyHours[index]),
          percentage: roundToTwoDecimals(
            (dailyHours[index] / totals.totalHours) * 100,
          ),
        })),

        // Top performing metrics
        topProjects: Object.values(projectGroups)
          .sort((a: any, b: any) => b.totalHours - a.totalHours)
          .slice(0, 5)
          .map((project: any) => ({
            name: project.projectName,
            client: project.clientName,
            hours: roundToTwoDecimals(project.totalHours),
            amount: roundToTwoDecimals(project.totalAmount),
            percentage: roundToTwoDecimals(
              (project.totalHours / totals.totalHours) * 100,
            ),
          })),

        topClients: Object.values(clientGroups)
          .sort((a: any, b: any) => b.totalHours - a.totalHours)
          .slice(0, 5)
          .map((client: any) => ({
            name: client.clientName,
            hours: roundToTwoDecimals(client.totalHours),
            amount: roundToTwoDecimals(client.totalAmount),
            projectsCount: Object.keys(client.projects).length,
            percentage: roundToTwoDecimals(
              (client.totalHours / totals.totalHours) * 100,
            ),
          })),

        // Peak hours
        peakHours: hourlyDistribution
          .map((hours, index) => ({
            hour: index,
            hours: roundToTwoDecimals(hours),
          }))
          .filter((h) => h.hours > 0)
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 3),
      };

      return c.json({
        dateRange: { startDate, endDate },
        totalDays,
        productivity: metrics,
      });
    },
  );

  /**
   * @openapi exportTimeEntries
   * @tags reports
   * @description Export time entries as CSV.
   */
  router.get(
    '/api/reports/export/time-entries',
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
    })),
    async (c) => {
      const { startDate, endDate, clientId, projectId } = c.var.input;
      const userId = c.var.subject.id;

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const whereClause = {
        userId,
        startedAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
        ...(clientId ? { project: { clientId } } : {}),
        ...(projectId ? { projectId } : {}),
      };

      const timeEntries = await prisma.timeEntry.findMany({
        where: whereClause,
        orderBy: { startedAt: 'desc' },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      const csv = exportTimeEntriesToCSV(timeEntries);
      const filename = `time-entries-${startDate.split('T')[0]}-to-${endDate.split('T')[0]}.csv`;

      return new Response(csv, {
        headers: getCSVHeaders(filename),
      });
    },
  );

  /**
   * @openapi exportInvoices
   * @tags reports
   * @description Export invoices as CSV.
   */
  router.get(
    '/api/reports/export/invoices',
    authenticated(),
    validate((payload) => ({
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
      const { status, clientId } = c.var.input;
      const userId = c.var.subject.id;

      const whereClause = {
        userId,
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
      };

      const invoices = await prisma.invoice.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          invoiceLines: {
            include: {
              project: true,
            },
          },
        },
      });

      const csv = exportInvoicesToCSV(invoices);
      const filename = `invoices-${new Date().toISOString().split('T')[0]}.csv`;

      return new Response(csv, {
        headers: getCSVHeaders(filename),
      });
    },
  );

  /**
   * @openapi exportClientTimeEntries
   * @tags reports
   * @description Export all time entries for a specific client as CSV.
   */
  router.get(
    '/api/reports/export/clients/:clientId/time-entries',
    authenticated(),
    validate((payload) => ({
      clientId: {
        select: payload.params.clientId,
        against: z.string().uuid(),
      },
      startDate: {
        select: payload.query.startDate,
        against: z.string().datetime().optional(),
      },
      endDate: {
        select: payload.query.endDate,
        against: z.string().datetime().optional(),
      },
    })),
    async (c) => {
      const { clientId, startDate, endDate } = c.var.input;
      const userId = c.var.subject.id;

      // Verify client exists and belongs to user
      const client = await prisma.client.findFirstOrThrow({
        where: {
          id: clientId,
          userId,
        },
      });

      const whereClause = {
        userId,
        project: { clientId },
        ...(startDate || endDate
          ? {
              startedAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      };

      const timeEntries = await prisma.timeEntry.findMany({
        where: whereClause,
        orderBy: { startedAt: 'desc' },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      const csv = exportTimeEntriesToCSV(timeEntries);
      const dateRangeStr =
        startDate && endDate
          ? `${startDate.split('T')[0]}-to-${endDate.split('T')[0]}`
          : 'all-time';
      const filename = `${client.name.replace(/[^a-zA-Z0-9]/g, '-')}-time-entries-${dateRangeStr}.csv`;

      return new Response(csv, {
        headers: getCSVHeaders(filename),
      });
    },
  );

  /**
   * @openapi exportProjectTimeEntries
   * @tags reports
   * @description Export all time entries for a specific project as CSV.
   */
  router.get(
    '/api/reports/export/projects/:projectId/time-entries',
    authenticated(),
    validate((payload) => ({
      projectId: {
        select: payload.params.projectId,
        against: z.string().uuid(),
      },
      startDate: {
        select: payload.query.startDate,
        against: z.string().datetime().optional(),
      },
      endDate: {
        select: payload.query.endDate,
        against: z.string().datetime().optional(),
      },
    })),
    async (c) => {
      const { projectId, startDate, endDate } = c.var.input;
      const userId = c.var.subject.id;

      // Verify project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
        include: {
          client: true,
        },
      });

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }

      const whereClause = {
        userId,
        projectId,
        ...(startDate || endDate
          ? {
              startedAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      };

      const timeEntries = await prisma.timeEntry.findMany({
        where: whereClause,
        orderBy: { startedAt: 'desc' },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      const csv = exportTimeEntriesToCSV(timeEntries);
      const dateRangeStr =
        startDate && endDate
          ? `${startDate.split('T')[0]}-to-${endDate.split('T')[0]}`
          : 'all-time';
      const filename = `${project.client?.name.replace(/[^a-zA-Z0-9]/g, '-')}-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}-time-entries-${dateRangeStr}.csv`;

      return new Response(csv, {
        headers: getCSVHeaders(filename),
      });
    },
  );

  /**
   * @openapi exportClientProjectsTimeEntries
   * @tags reports
   * @description Export time entries for multiple projects of a specific client as CSV.
   */
  router.post(
    '/api/reports/export/clients/:clientId/projects/time-entries',
    authenticated(),
    validate((payload) => ({
      clientId: {
        select: payload.params.clientId,
        against: z.string().uuid(),
      },
      projectIds: {
        select: payload.body.projectIds,
        against: z.array(z.string().uuid()).min(1).max(50),
      },
      startDate: {
        select: payload.body.startDate,
        against: z.string().datetime().optional(),
      },
      endDate: {
        select: payload.body.endDate,
        against: z.string().datetime().optional(),
      },
    })),
    async (c) => {
      const { clientId, projectIds, startDate, endDate } = c.var.input;
      const userId = c.var.subject.id;

      // Verify client exists and belongs to user
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId,
        },
      });

      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      // Verify all projects exist, belong to user, and belong to the specified client
      const projects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
          userId,
          clientId,
        },
      });

      if (projects.length !== projectIds.length) {
        const foundIds = projects.map((p) => p.id);
        const missingIds = projectIds.filter((id) => !foundIds.includes(id));
        return c.json(
          {
            error: 'Some projects not found or do not belong to this client',
            missingProjectIds: missingIds,
          },
          404,
        );
      }

      const whereClause = {
        userId,
        projectId: { in: projectIds },
        project: { clientId },
        ...(startDate || endDate
          ? {
              startedAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      };

      const timeEntries = await prisma.timeEntry.findMany({
        where: whereClause,
        orderBy: [{ project: { name: 'asc' } }, { startedAt: 'desc' }],
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      const csv = exportTimeEntriesToCSV(timeEntries);
      const dateRangeStr =
        startDate && endDate
          ? `${startDate.split('T')[0]}-to-${endDate.split('T')[0]}`
          : 'all-time';
      const filename = `${client.name.replace(/[^a-zA-Z0-9]/g, '-')}-selected-projects-time-entries-${dateRangeStr}.csv`;

      return new Response(csv, {
        headers: getCSVHeaders(filename),
      });
    },
  );
}
