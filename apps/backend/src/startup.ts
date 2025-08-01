import z from 'zod';

import { prisma } from '@iworked/db';

import { parse } from './middlewares/validator.ts';

const env = z.object({
  CONNECTION_STRING: z.string(),
  NODE_ENV: z.enum(['development', 'production']),
  FRONTEND_URL: z.string().url().optional(),
  AGENT_BASE_URL: z.string().url(),
});

try {
  const data = await parse(env, process.env);
  process.env = Object.assign({}, process.env, data);
} catch (error) {
  console.error(
    'Please check that all required environment variables are correctly set.',
  );
  console.dir(error, { depth: null });
  process.exit(1);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // Extend the ProcessEnv interface with the parsed environment variables
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof env> {}
  }
}

await prisma.$connect();
