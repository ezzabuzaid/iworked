import { lstat, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';

export default async function (router: Hono) {
  const frontendDir = join(
    relative(process.cwd(), import.meta.dirname),
    '../',
    '../',
    'frontend',
    'dist',
  );

  // Frontend routes
  router.use('*', serveStatic({ root: frontendDir }));
  router.get('*', async (c) => {
    const exists = await lstat(`${frontendDir}/index.html`)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      if (process.env.NODE_ENV === 'development') {
        console.error(
          `Build the frontend app first. run "nx run frontend:build"`,
        );
        return c.json({ error: 'Build the frontend app first' }, 404);
      }
      return c.json({ error: 'Not found. Talk to the website admin.' }, 404);
    }
    return c.html(await readFile(`${frontendDir}/index.html`, 'utf-8'));
  });
}
