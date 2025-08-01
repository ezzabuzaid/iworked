import { Agent, type Suggestion } from '@sdk-it/march';
import { useLocalStorage } from '@uidotdev/usehooks';
import * as Icons from 'lucide-react';
import { useMemo } from 'react';

import { authClient } from '../auth-client.ts';

const anonymousSuggestions = [
  {
    prefix: '/anonymous',
    icon: <Icons.WandSparkles size={16} />,
    label: 'Continue as Guest',
    description: 'Interact with the agent without logging in',
    async *onClick() {
      yield { loading: true, error: null };
      try {
        await authClient.signIn.anonymous({}, { throw: true });
        yield { loading: false, error: null };
      } catch (error) {
        yield { loading: false, error: error };
      }
    },
  },
];

const authenticatedSuggestions: Suggestion[] = [
  {
    prefix: '/projects',
    icon: <Icons.Briefcase size={16} />,
    label: 'Projects',
    description: 'View and manage your projects',
    prompt: 'show me all projects',
  },
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

        localStorage.removeItem('authToken');
        localStorage.removeItem('jwtToken');
        yield { loading: false, error: null };
      } catch (error) {
        yield { loading: false, error: error };
      }
    },
  },
];

export default function Home() {
  const session = authClient.useSession();
  const [token] = useLocalStorage('jwtToken', '');
  const [authToken] = useLocalStorage('authToken', '');
  const metadata = useMemo(
    () => ({ authToken: `Bearer ${authToken}` }),
    [authToken],
  );
  return (
    <Agent
      title={'IWorked Agent'}
      description={'Ask questions about your projects, clients, and tasks.'}
      baseUrl={import.meta.env.VITE_AGENT_BASE_URL}
      token={`Bearer ${token}`}
      metadata={metadata}
      suggestions={
        session.data ? authenticatedSuggestions : anonymousSuggestions
      }
    />
  );
}
