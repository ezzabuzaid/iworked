import { Hono } from 'hono';
import { z } from 'zod';

import type { Prisma } from '@iworked/db';
import { prisma } from '@iworked/db';

import { verifyToken } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi createClient
   * @tags clients
   * @description Create a new client for the authenticated user.
   */
  router.post(
    '/api/clients',
    verifyToken(),
    validate((payload) => ({
      name: {
        select: payload.body.name,
        against: z.string().min(1).max(255),
      },
      email: {
        select: payload.body.email,
        against: z.string().email().optional(),
      },
    })),
    async (c) => {
      const { name, email } = c.var.input;

      const client = await prisma.client.create({
        data: {
          name,
          email,
          userId: c.var.subject.id,
        },
      });

      return c.json(client, 201);
    },
  );

  /**
   * @openapi getClients
   * @tags clients
   * @description Get a paginated list of clients for the authenticated user.
   */
  router.get(
    '/api/clients',
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
    })),
    async (c) => {
      const { page, pageSize } = c.var.input;

      const where: Prisma.ClientWhereInput = {
        userId: c.var.subject.id,
      };

      const totalCount = await prisma.client.count({ where });

      const clients = await prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              projects: true,
              invoices: true,
            },
          },
        },
      });

      return c.json({
        data: clients,
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
   * @openapi getClient
   * @tags clients
   * @description Get a specific client by ID.
   */
  router.get(
    '/api/clients/:id',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const client = await prisma.client.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          projects: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              invoices: true,
            },
          },
        },
      });

      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      return c.json(client);
    },
  );

  /**
   * @openapi updateClient
   * @tags clients
   * @description Update a client's information.
   */
  router.patch(
    '/api/clients/:id',
    verifyToken(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      name: {
        select: payload.body.name,
        against: z.string().min(1).max(255).optional(),
      },
      email: {
        select: payload.body.email,
        against: z.string().email().optional(),
      },
    })),
    async (c) => {
      const { id, name, email } = c.var.input;

      // Check if client exists and belongs to user
      const existingClient = await prisma.client.findFirst({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

      if (!existingClient) {
        return c.json({ error: 'Client not found' }, 404);
      }

      const updateData: Prisma.ClientUpdateInput = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        return c.json(existingClient);
      }

      const client = await prisma.client.update({
        where: { id },
        data: updateData,
      });

      return c.json(client);
    },
  );
}
