import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { anonymous, bearer, jwt } from 'better-auth/plugins';

import { prisma } from '@iworked/db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    debugLogs: false,
  }),
  trustedOrigins: [
    'http://localhost:1421',
    'http://localhost:3000',
    'https://iworked.fly.dev',
  ],
  emailAndPassword: {
    enabled: true,
    disableSignUp: false, // let's not support sign up via email for now
    autoSignIn: true, // automatically sign in users after registration
    requireEmailVerification: true, // block login until verified
    minPasswordLength: 8,
  },
  plugins: [
    bearer(),
    jwt({
      jwt: {
        audience: process.env.AGENT_BASE_URL,
      },
    }),
    anonymous(),
  ],
}) as any;
