import { Agent } from '@sdk-it/march';
import { useLocalStorage } from '@uidotdev/usehooks';
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
            onSuccess: async (ctx) => {
              localStorage.setItem(
                'chatSessionId',
                JSON.stringify(ctx.data.chatSessionId),
              );
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
  console.log('Session:', session.data, import.meta.env);
  const [chatSessionId] = useLocalStorage('chatSessionId', '');
  return (
    <Agent
      title={'IWorked Agent'}
      description={'Ask questions about your projects, clients, and tasks.'}
      baseUrl={import.meta.env.VITE_AGENT_BASE_URL}
      suggestions={session.data ? logoutSuggestions : anonymousSuggestions}
      sessionId={chatSessionId}
    />
  );
}
