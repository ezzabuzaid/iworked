import {
  anonymousClient,
  customSessionClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import type { auth } from '@iworked/auth';

export function getOrigin(defaultOrigin = ''): string {
  let origin = '';
  try {
    origin = window.location.origin;
  } catch {
    origin = defaultOrigin;
  }
  return origin;
}

export const authClient = createAuthClient({
  plugins: [anonymousClient(), customSessionClient<typeof auth>()],
  baseURL:
    import.meta.env.VITE_API_URL === '/'
      ? getOrigin()
      : import.meta.env.VITE_API_URL,
});
