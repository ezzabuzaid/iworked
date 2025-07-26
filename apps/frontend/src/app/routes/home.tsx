import { Agent } from '@agent/react';
import * as Icons from 'lucide-react';

import { authClient } from '../auth-client.tsx';

const anonymousSuggestions = [
  {
    prefix: '/anonymous',
    icon: <Icons.WandSparkles size={16} />,
    label: 'Continue as Guest',
    description: 'Interact with the agent without logging in',
    async *onClick() {
      yield { loading: true, error: null };
      try {
        await authClient.signIn.anonymous(
          {},
          {
            throw: true,
            async onSuccess(context) {
              window.location.reload();
            },
          },
        );
        yield { loading: false, error: null };
      } catch (error) {
        yield { loading: false, error: error };
      }
    },
  },
];

const logoutSuggestions = [
  {
    prefix: '/logout',
    icon: <Icons.LogOut size={16} />,
    label: 'Sign Out',
    description: 'Sign out of your account',
    async *onClick() {
      yield { loading: true, error: null };
      try {
        await authClient.signOut({
          fetchOptions: {
            throw: true,
            onSuccess: () => {
              window.location.reload();
            },
          },
        });
        yield { loading: false, error: null };
      } catch (error) {
        yield { loading: false, error: error };
      }
    },
  },
];

export default function Home() {
  const session = authClient.useSession();
  console.log('Session:', session.data);
  return (
    <Agent
      title={'IWorked Agent'}
      description={'Ask questions about your projects, clients, and tasks.'}
      baseUrl={'http://localhost:3100'}
      suggestions={session.data ? logoutSuggestions : anonymousSuggestions}
      sessionId={(session.data as any)?.chatSessionId}
    />
  );
}
