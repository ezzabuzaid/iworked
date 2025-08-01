import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { Prisma } from '@iworked/db';
import { prisma } from '@iworked/db';

import {
  checkBulkTimeEntryOverlaps,
  checkTimeEntryOverlap,
  sanitizeInput,
  validateTimeEntryDuration,
} from '../core/validation.ts';
import { authenticated } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi createTimeEntry
   * @tags timeEntries
   * @description Create a new time entry for a project.
   */
  router.post(
    '/api/time-entries',
    authenticated(),
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
      const sanitizedNote = sanitizeInput(note);

      // Enhanced validation
      validateTimeEntryDuration(startDate, endDate);
      await checkTimeEntryOverlap(c.var.subject.id, startDate, endDate);

      // Verify project exists and belongs to user
      await prisma.project.findUniqueOrThrow({
        where: {
          id: projectId,
          userId: c.var.subject.id,
        },
      });

      const timeEntry = await prisma.timeEntry.create({
        data: {
          startedAt: startDate,
          endedAt: endDate,
          note: sanitizedNote,
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
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const timeEntry = await prisma.timeEntry.findUniqueOrThrow({
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
    authenticated(),
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
      const sanitizedNote = sanitizeInput(note);

      // Check if time entry exists and belongs to user
      const existingTimeEntry = await prisma.timeEntry.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

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

        // Enhanced validation
        validateTimeEntryDuration(newStartedAt, newEndedAt);
        await checkTimeEntryOverlap(
          c.var.subject.id,
          newStartedAt,
          newEndedAt,
          id,
        );

        if (startedAt !== undefined) updateData.startedAt = newStartedAt;
        if (endedAt !== undefined) updateData.endedAt = newEndedAt;
      }

      if (note !== undefined) updateData.note = sanitizedNote;

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
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Check if time entry exists and belongs to user
      const existingTimeEntry = await prisma.timeEntry.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

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

  /**
   * @openapi bulkCreateTimeEntries
   * @tags timeEntries
   * @description Create multiple time entries in a single transaction.
   */
  router.post(
    '/api/time-entries/bulk',
    authenticated(),
    validate((payload) => ({
      entries: {
        select: payload.body.entries,
        against: z
          .array(
            z.object({
              startedAt: z.string().datetime(),
              endedAt: z.string().datetime(),
              note: z.string().optional(),
              projectId: z.string().uuid(),
            }),
          )
          .min(1)
          .max(50), // Limit bulk operations
      },
    })),
    async (c) => {
      const { entries } = c.var.input;
      const userId = c.var.subject.id;

      // Validate all entries before creating any
      const validatedEntries = [];
      const overlapCheckEntries = [];

      for (const entry of entries) {
        const startDate = new Date(entry.startedAt);
        const endDate = new Date(entry.endedAt);
        const sanitizedNote = sanitizeInput(entry.note);

        // Validate duration
        validateTimeEntryDuration(startDate, endDate);

        // Verify project exists and belongs to user
        await prisma.project.findUniqueOrThrow({
          where: {
            id: entry.projectId,
            userId,
          },
        });

        validatedEntries.push({
          startedAt: startDate,
          endedAt: endDate,
          note: sanitizedNote,
          projectId: entry.projectId,
          userId,
        });

        overlapCheckEntries.push({
          startedAt: startDate,
          endedAt: endDate,
        });
      }

      // Perform bulk overlap validation in a single query
      await checkBulkTimeEntryOverlaps(userId, overlapCheckEntries);

      // Create all entries in a transaction
      const createdEntries = await prisma.$transaction(
        validatedEntries.map((entry) =>
          prisma.timeEntry.create({
            data: entry,
            include: {
              project: {
                include: {
                  client: true,
                },
              },
            },
          }),
        ),
      );

      return c.json(
        {
          message: `Successfully created ${createdEntries.length} time entries`,
          entries: createdEntries,
        },
        201,
      );
    },
  );

  /**
   * @openapi bulkDeleteTimeEntries
   * @tags timeEntries
   * @description Delete multiple time entries by IDs.
   */
  router.delete(
    '/api/time-entries/bulk',
    authenticated(),
    validate((payload) => ({
      ids: {
        select: payload.body.ids,
        against: z.array(z.string().uuid()).min(1).max(100),
      },
    })),
    async (c) => {
      const { ids } = c.var.input;
      const userId = c.var.subject.id;

      // Check all entries exist, belong to user, and are not locked
      const existingEntries = await prisma.timeEntry.findMany({
        where: {
          id: { in: ids },
          userId,
        },
      });

      if (existingEntries.length !== ids.length) {
        const foundIds = existingEntries.map((e) => e.id);
        const missingIds = ids.filter((id) => !foundIds.includes(id));
        throw new HTTPException(404, {
          message: 'Some time entries were not found',
          cause: {
            code: 'api/entries-not-found',
            detail: `Time entries not found: ${missingIds.join(', ')}`,
          },
        });
      }

      const lockedEntries = existingEntries.filter((e) => e.isLocked);
      if (lockedEntries.length > 0) {
        throw new HTTPException(400, {
          message: 'Cannot delete locked time entries',
          cause: {
            code: 'api/entries-locked',
            detail: `Locked entries: ${lockedEntries.map((e) => e.id).join(', ')}`,
          },
        });
      }

      // Delete all entries
      await prisma.timeEntry.deleteMany({
        where: {
          id: { in: ids },
          userId,
        },
      });

      return c.json({
        message: `Successfully deleted ${ids.length} time entries`,
        deletedIds: ids,
      });
    },
  );

  /**
   * @openapi bulkUpdateTimeEntries
   * @tags timeEntries
   * @description Update multiple time entries with the same data.
   */
  router.patch(
    '/api/time-entries/bulk',
    authenticated(),
    validate((payload) => ({
      ids: {
        select: payload.body.ids,
        against: z.array(z.string().uuid()).min(1).max(100),
      },
      updates: {
        select: payload.body.updates,
        against: z.object({
          note: z.string().optional(),
          projectId: z.string().uuid().optional(),
        }),
      },
    })),
    async (c) => {
      const { ids, updates } = c.var.input;
      const userId = c.var.subject.id;
      const sanitizedNote = sanitizeInput(updates.note);

      // Check all entries exist, belong to user, and are not locked
      const existingEntries = await prisma.timeEntry.findMany({
        where: {
          id: { in: ids },
          userId,
        },
      });

      if (existingEntries.length !== ids.length) {
        const foundIds = existingEntries.map((e) => e.id);
        const missingIds = ids.filter((id) => !foundIds.includes(id));
        throw new HTTPException(404, {
          message: 'Some time entries were not found',
          cause: {
            code: 'api/entries-not-found',
            detail: `Time entries not found: ${missingIds.join(', ')}`,
          },
        });
      }

      const lockedEntries = existingEntries.filter((e) => e.isLocked);
      if (lockedEntries.length > 0) {
        throw new HTTPException(400, {
          message: 'Cannot update locked time entries',
          cause: {
            code: 'api/entries-locked',
            detail: `Locked entries: ${lockedEntries.map((e) => e.id).join(', ')}`,
          },
        });
      }

      // If updating project, verify it exists and belongs to user
      if (updates.projectId) {
        await prisma.project.findUniqueOrThrow({
          where: {
            id: updates.projectId,
            userId,
          },
        });
      }

      // Build update data
      const updateData: Prisma.TimeEntryUpdateInput = {};
      if (sanitizedNote !== undefined) updateData.note = sanitizedNote;
      if (updates.projectId) {
        updateData.project = {
          connect: { id: updates.projectId },
        };
      }

      if (Object.keys(updateData).length === 0) {
        return c.json({
          message: 'No updates provided',
          updatedCount: 0,
        });
      }

      // Update all entries
      const result = await prisma.timeEntry.updateMany({
        where: {
          id: { in: ids },
          userId,
        },
        data: updateData,
      });

      return c.json({
        message: `Successfully updated ${result.count} time entries`,
        updatedCount: result.count,
      });
    },
  );
}
