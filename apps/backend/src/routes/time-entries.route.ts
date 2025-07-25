import type { Prisma } from '@prisma/client';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import { prisma } from '@iworked/db';

import { verifyToken } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi createTimeEntry
   * @tags timeEntries
   * @description Create a new time entry for a project.
   */
  router.post(
    '/api/time-entries',
    verifyToken(),
    validate((payload) => ({
      startedAt: {
        select: payload.body.startedAt,
        against: z.string().datetime(),
      },
      endedAt: {
        select: payload.body.endedAt,
        against: z.string().datetime(),
      },
      note: {
        select: payload.body.note,
        against: z.string().optional(),
      },
      projectId: {
        select: payload.body.projectId,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { startedAt, endedAt, note, projectId } = c.var.input;

      const startDate = new Date(startedAt);
      const endDate = new Date(endedAt);

      // Validate time range (FR-3)
      if (endDate <= startDate) {
        throw new HTTPException(400, {
          message: 'End time must be after start time',
          cause: {
            code: 'api/invalid-time-range',
            detail: 'endedAt must be greater than startedAt',
          },
        });
      }

      // Verify project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: c.var.subject.id,
        },
      });

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }

      const timeEntry = await prisma.timeEntry.create({
        data: {
          startedAt: startDate,
          endedAt: endDate,
          note,
          projectId,
          userId: c.var.subject.id,
        },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      return c.json(timeEntry, 201);
    },
  );

  /**
   * @openapi getTimeEntries
   * @tags timeEntries
   * @description Get a paginated list of time entries for the authenticated user.
   */
  router.get(
    '/api/time-entries',
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
      projectId: {
        select: payload.query.projectId,
        against: z.string().uuid().optional(),
      },
      clientId: {
        select: payload.query.clientId,
        against: z.string().uuid().optional(),
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
      const { page, pageSize, projectId, clientId, startDate, endDate } =
        c.var.input;

      const where: Prisma.TimeEntryWhereInput = {
        userId: c.var.subject.id,
        ...(projectId ? { projectId } : {}),
        ...(clientId ? { project: { clientId } } : {}),
        ...(startDate || endDate
          ? {
              startedAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      };

      const totalCount = await prisma.timeEntry.count({ where });

      const timeEntries = await prisma.timeEntry.findMany({
        where,
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

      return c.json({
        data: timeEntries,
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
   * @openapi getTimeEntry
   * @tags timeEntries
   * @description Get a specific time entry by ID.
   */
  router.get(
    '/api/time-entries/:id',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const timeEntry = await prisma.timeEntry.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!timeEntry) {
        return c.json({ error: 'Time entry not found' }, 404);
      }

      return c.json(timeEntry);
    },
  );

  /**
   * @openapi updateTimeEntry
   * @tags timeEntries
   * @description Update a time entry (only if not locked in an invoice).
   */
  router.patch(
    '/api/time-entries/:id',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      startedAt: {
        select: payload.body.startedAt,
        against: z.string().datetime().optional(),
      },
      endedAt: {
        select: payload.body.endedAt,
        against: z.string().datetime().optional(),
      },
      note: {
        select: payload.body.note,
        against: z.string().optional(),
      },
    })),
    async (c) => {
      const { id, startedAt, endedAt, note } = c.var.input;

      // Check if time entry exists and belongs to user
      const existingTimeEntry = await prisma.timeEntry.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

      if (!existingTimeEntry) {
        return c.json({ error: 'Time entry not found' }, 404);
      }

      // Check if time entry is locked (FR-7)
      if (existingTimeEntry.isLocked) {
        throw new HTTPException(400, {
          message: 'Time entry is locked and cannot be modified',
          cause: {
            code: 'api/time-entry-locked',
            detail:
              'This time entry is part of a non-draft invoice and cannot be modified',
          },
        });
      }

      const updateData: Prisma.TimeEntryUpdateInput = {};

      if (startedAt !== undefined || endedAt !== undefined) {
        const newStartedAt = startedAt
          ? new Date(startedAt)
          : existingTimeEntry.startedAt;
        const newEndedAt = endedAt
          ? new Date(endedAt)
          : existingTimeEntry.endedAt;

        // Validate time range (FR-3)
        if (newEndedAt <= newStartedAt) {
          throw new HTTPException(400, {
            message: 'End time must be after start time',
            cause: {
              code: 'api/invalid-time-range',
              detail: 'endedAt must be greater than startedAt',
            },
          });
        }

        if (startedAt !== undefined) updateData.startedAt = newStartedAt;
        if (endedAt !== undefined) updateData.endedAt = newEndedAt;
      }

      if (note !== undefined) updateData.note = note;

      if (Object.keys(updateData).length === 0) {
        return c.json(existingTimeEntry);
      }

      const timeEntry = await prisma.timeEntry.update({
        where: { id },
        data: updateData,
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      return c.json(timeEntry);
    },
  );

  /**
   * @openapi deleteTimeEntry
   * @tags timeEntries
   * @description Delete a time entry (only if not locked in an invoice).
   */
  router.delete(
    '/api/time-entries/:id',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Check if time entry exists and belongs to user
      const existingTimeEntry = await prisma.timeEntry.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

      if (!existingTimeEntry) {
        return c.json({ error: 'Time entry not found' }, 404);
      }

      // Check if time entry is locked (FR-7)
      if (existingTimeEntry.isLocked) {
        throw new HTTPException(400, {
          message: 'Time entry is locked and cannot be deleted',
          cause: {
            code: 'api/time-entry-locked',
            detail:
              'This time entry is part of a non-draft invoice and cannot be deleted',
          },
        });
      }

      await prisma.timeEntry.delete({
        where: { id },
      });

      return c.json({ message: 'Time entry deleted successfully' });
    },
  );
}
