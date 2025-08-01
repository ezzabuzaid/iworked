import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

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
  plugins: [anonymousClient()],
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get('set-auth-token');
      const jwtToken = ctx.response.headers.get('set-auth-jwt');
      if (authToken) {
        localStorage.setItem('authToken', JSON.stringify(authToken));
      }
      if (jwtToken) {
        localStorage.setItem('jwtToken', JSON.stringify(jwtToken));
      }
    },
  },
  baseURL:
    import.meta.env.VITE_API_URL === '/'
      ? getOrigin()
      : import.meta.env.VITE_API_URL,
});
