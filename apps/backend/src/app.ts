import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { timing } from 'hono/timing';

import { auth } from '@iworked/auth';
import { Prisma } from '@iworked/db';

const app = new Hono().use(
  logger(),
  timing(),
  cors({ origin: () => process.env.FRONTEND_URL, credentials: true }),
  requestId(),
  contextStorage(),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(
  '/openapi.json',
  serveStatic({
    path: './openapi.json',
    rewriteRequestPath: () => '/openapi.json',
  }),
);

for await (const route of [
  import('./routes/clients.route.ts'),
  import('./routes/projects.route.ts'),
  import('./routes/time-entries.route.ts'),
  import('./routes/reports.route.ts'),
  import('./routes/invoices.route.ts'),
  // always import the ui route last to ensure it catches all unmatched routes
  import('./routes/ui.route.ts'),
]) {
  route.default(app);
}

app.notFound((c) => {
  throw new HTTPException(404, {
    message: 'Not Found',
    cause: {
      code: 'api/not-found',
      detail: 'The requested resource was not found',
      instance: c.req.url,
    },
  });
});

app.onError((error, context) => {
  if (process.env.NODE_ENV === 'development') {
    console.dir(error, { depth: Infinity });
  }
  if (error instanceof HTTPException) {
    return context.json(
      {
        error: error.message,
        cause: error.cause,
      },
      error.status,
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const model = error.meta?.modelName;
        const fields = error.meta?.target;
        return context.json(
          {
            error: `Duplicate entry in ${model} table found.`,
            cause: {
              code: 'api/unique-constraint-failed',
              detail: `Unique constraint failed on the ${model} table for the ${fields} field`,
            },
          },
          409,
        );
      }
      case 'P2003': {
        const model = error.meta?.modelName;
        const [, field] = ((error.meta?.constraint as string) || '').split('_');
        return context.json(
          {
            error: `Foreign key constraint failed on ${model} table.`,
            cause: {
              code: 'api/foreign-key-constraint-failed',
              detail: `Foreign key constraint failed on the ${model} table for the '${field}' field`,
            },
          },
          400,
        );
      }
      case 'P2025': {
        return context.json(
          {
            error: error.message || `Record not found`,
            cause: {
              code: 'api/record-not-found',
              detail: `Record not found`,
            },
          },
          400,
        );
      }
    }
  }

  return context.json(
    {
      error: 'Internal Server Error',
      // cause: process.env.NODE_ENV === 'development' ? error : undefined,
      cause: error,
    },
    500,
  );
});

export default app;
