import type { BetterAuthPlugin } from 'better-auth';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  anonymous,
  bearer,
  createAuthMiddleware,
  customSession,
} from 'better-auth/plugins';

import { prisma } from '@iworked/db';

async function getChatSessionId(token: string): Promise<string> {
  const res = await fetch('http://localhost:3100/api/chat-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CHAT_API_KEY!,
    },
    body: JSON.stringify({
      userId: 'user-id',
      token,
    }),
  });
  const data = (await res.json()) as { token: string };
  return data.token;
}

export const chatSync = (): BetterAuthPlugin => ({
  id: 'chat-sync',
  hooks: {
    after: [
      {
        matcher: (ctx) =>
          ctx.path.startsWith('/sign-in') || ctx.path.startsWith('/sign-up'),
        handler: createAuthMiddleware(async (ctx) => {
          const token = ctx.context.responseHeaders?.get('set-auth-token'); // now defined
          if (!token) return;

          const chatId = await getChatSessionId(token);
          ctx.setCookie('chat_session_id', chatId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
          });
        }),
      },
    ],
  },
});

const options = {
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    debugLogs: false,
  }),
  trustedOrigins: ['http://localhost:1421', 'https://iworked.fly.dev'],
  emailAndPassword: {
    enabled: true,
    disableSignUp: false, // let's not support sign up via email for now
    autoSignIn: true, // automatically sign in users after registration
    requireEmailVerification: true, // block login until verified
    minPasswordLength: 8,
  },
  plugins: [
    bearer(),
    chatSync(),
    anonymous(),
    customSession(async ({ user, session }, ctx) => {
      return {
        chatSessionId: ctx.getCookie('chat_session_id'),
        user,
        session,
      };
    }),
  ],
} satisfies BetterAuthOptions;

export const auth: ReturnType<typeof betterAuth<BetterAuthOptions>> =
  betterAuth(options);
