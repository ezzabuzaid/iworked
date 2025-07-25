import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { anonymous, customSession } from 'better-auth/plugins';

import { prisma } from '@iworked/db';

const options = {
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    debugLogs: false,
  }),
  trustedOrigins: ['http://localhost:5173', 'https://iworked.fly.dev'],
  emailAndPassword: {
    enabled: true,
    disableSignUp: false, // let's not support sign up via email for now
    autoSignIn: true, // automatically sign in users after registration
    requireEmailVerification: true, // block login until verified
    minPasswordLength: 8,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: 'offline', // get a refresh token first try
      prompt: 'select_account+consent',
    },
  },
  plugins: [
    anonymous(),
    customSession(async ({ user, session }) => {
      const projects = await prisma.project.findMany({
        where: {
          userId: user.id,
        },
      });
      return {
        user: {
          ...user,
          projects,
        },
        session: session,
      };
    }),
  ],
} satisfies BetterAuthOptions;

export const auth: ReturnType<typeof betterAuth<BetterAuthOptions>> =
  betterAuth(options);
