import type { Session, User } from 'better-auth';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { auth } from '@iworked/auth';

export function authenticated(): MiddlewareHandler<{
  Variables: {
    subject: User;
    session: Session;
  };
}> {
  return async (c, next) => {
    const headers = new Headers(c.req.raw.headers);
    const base64Metadata = headers.get('x-metadata');
    if (!base64Metadata) {
      throw new HTTPException(400, {
        message: 'Missing metadata header',
        cause: {
          code: 'api/invalid-metadata',
          detail: 'Metadata header is required for this request',
        },
      });
    }
    const metadata = JSON.parse(
      Buffer.from(base64Metadata, 'base64').toString(),
    );
    headers.set('authorization', metadata.authToken);
    const session = await auth.api.getSession({ headers });
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
