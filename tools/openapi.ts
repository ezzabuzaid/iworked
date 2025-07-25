import { execFile } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { defaultTypesMap } from '@sdk-it/core';
import { analyze } from '@sdk-it/generic';
import { responseAnalyzer } from '@sdk-it/hono';
import { generate } from '@sdk-it/typescript';

const { paths, components, tags } = await analyze(
  'apps/backend/tsconfig.app.json',
  {
    responseAnalyzer,
    imports: [
      {
        import: 'commonZod',
        from: join(cwd(), 'packages/isomorphic/src/lib/validators.ts'),
      },
      {
        import: 'Prisma',
        from: join(cwd(), 'node_modules/@prisma/client/default.js'),
      },
      {
        import: '$Enums',
        from: join(cwd(), 'node_modules/@prisma/client/default.js'),
      },
    ],
    typesMap: {
      ...defaultTypesMap,
      Decimal: 'string',
      JsonValue: '#/components/schemas/JsonValue',
    },
    onOperation: (sourceFile, method, path, operation) => {
      operation.responses ??= {};
      const existing400 = operation.responses[400];
      operation.responses[400] = {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                existing400?.content?.['application/json'],
                { $ref: '#/components/schemas/ValidationError' },
              ].filter(Boolean),
            },
          },
        },
      };
      operation.responses[401] ??= {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UnauthorizedErr' },
          },
        },
      };
      return {};
    },
  },
);

const spec: Parameters<typeof generate>[0] = {
  openapi: '3.1.0',
  info: { title: 'Virtual Care API', version: '1.0.0' },
  servers: [
    {
      url: '/',
      description: 'Same host',
    },
    { url: 'https://agent.fly.dev', description: 'Production server' },
    { url: 'http://localhost:3000', description: 'Local Server' },
  ],
  tags: tags.map((tag) => ({ name: tag })),
  security: [{ bearer: [] }],
  paths,
  components: {
    ...components,
    schemas: {
      ...components.schemas,
      UnauthorizedErr: {
        type: 'object',
        required: ['type', 'title'],
        additionalProperties: false,
        properties: {
          error: {
            type: 'string',
            enum: ['Unauthorized'],
          },
        },
      } as const,
      ValidationError: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      } as const,
      JsonValue: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
            { type: 'null' },
            { type: 'object' },
            {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' },
                  { type: 'boolean' },
                  { type: 'null' },
                  { type: 'object' },
                ],
              },
            },
          ],
        },
      },
    },
    securitySchemes: {
      bearer: {
        type: 'http',
        scheme: 'bearer',
      } as const,
    },
  },
};

await writeFile('openapi.json', JSON.stringify(spec, null, 2));

await generate(spec, {
  mode: 'minimal',
  output: join(process.cwd(), 'packages/client/src'),
  name: 'Agentic',
  readme: true,
  pagination: false,
  formatCode: ({ output, env }) => {
    execFile('prettier', ['openapi.json', output, '--write'], { env: env });
  },
});

await rm(join(process.cwd(), 'node_modules', '.vite'), {
  force: true,
  recursive: true,
});

console.log('OpenAPI client generated successfully!');
