import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { auth } from '@iworked/auth';
import type { Project } from '@iworked/db';

type Session = typeof auth.$Infer.Session.session;
type User = typeof auth.$Infer.Session.user & { projects: Project[] };
export function verifyToken(): MiddlewareHandler<{
  Variables: {
    subject: User;
    session: Session;
  };
}> {
  return async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      throw new HTTPException(401, {
        message: 'Authentication required',
        cause: {
          code: 'api/unauthenticated',
          detail: 'Authentication required to access this resource',
        },
      });
    }

    c.set('subject', session.user as User);
    c.set('session', session.session as Session);
    return next();
  };
}
