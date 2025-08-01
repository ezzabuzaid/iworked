import { Hono } from 'hono';
import { z } from 'zod';

import type { Prisma } from '@iworked/db';
import { prisma } from '@iworked/db';

import { authenticated } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi createProject
   * @tags projects
   * @description Create a new project for a client.
   */
  router.post(
    '/api/projects',
    authenticated(),
    validate((payload) => ({
      name: {
        select: payload.body.name,
        against: z.string().min(1).max(255),
      },
      description: {
        select: payload.body.description,
        against: z.string().optional(),
      },
      hourlyRate: {
        select: payload.body.hourlyRate,
        against: z.coerce.number().positive().optional(),
      },
      clientId: {
        select: payload.body.clientId,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { name, description, hourlyRate, clientId } = c.var.input;

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

      const project = await prisma.project.create({
        data: {
          name,
          description,
          hourlyRate: hourlyRate ? hourlyRate.toString() : null,
          clientId,
          userId: c.var.subject.id,
        },
        include: {
          client: true,
        },
      });

      return c.json(project, 201);
    },
  );

  /**
   * @openapi getProjects
   * @tags projects
   * @description Get a paginated list of projects for the authenticated user.
   */
  router.get(
    '/api/projects',
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
      clientId: {
        select: payload.query.clientId,
        against: z.string().uuid().optional(),
      },
    })),
    async (c) => {
      const { page, pageSize, clientId } = c.var.input;

      const where: Prisma.ProjectWhereInput = {
        userId: c.var.subject.id,
        ...(clientId ? { clientId } : {}),
      };

      const totalCount = await prisma.project.count({ where });

      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          client: true,
          _count: {
            select: {
              timeEntries: true,
            },
          },
        },
      });

      return c.json({
        data: projects,
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
   * @openapi getProject
   * @tags projects
   * @description Get a specific project by ID.
   */
  router.get(
    '/api/projects/:id',
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const project = await prisma.project.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          client: true,
          timeEntries: {
            orderBy: { startedAt: 'desc' },
            take: 10, // Latest 10 time entries
          },
          _count: {
            select: {
              timeEntries: true,
            },
          },
        },
      });

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }

      return c.json(project);
    },
  );

  /**
   * @openapi updateProject
   * @tags projects
   * @description Update a project's information.
   */
  router.patch(
    '/api/projects/:id',
    authenticated(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      name: {
        select: payload.body.name,
        against: z.string().min(1).max(255).optional(),
      },
      description: {
        select: payload.body.description,
        against: z.string().optional(),
      },
      hourlyRate: {
        select: payload.body.hourlyRate,
        against: z.coerce.number().positive().optional(),
      },
    })),
    async (c) => {
      const { id, name, description, hourlyRate } = c.var.input;

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

      if (!existingProject) {
        return c.json({ error: 'Project not found' }, 404);
      }

      const updateData: Prisma.ProjectUpdateInput = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (hourlyRate !== undefined)
        updateData.hourlyRate = hourlyRate.toString();

      if (Object.keys(updateData).length === 0) {
        return c.json(existingProject);
      }

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
        },
      });

      return c.json(project);
    },
  );
}
