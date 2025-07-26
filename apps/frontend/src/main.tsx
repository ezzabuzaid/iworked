import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import Home from './app/routes/home.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
]);
const root = createRoot(document.getElementById('root') as HTMLElement);

const queryClient = new QueryClient({
  // mutationCache: new MutationCache({}),
  // queryCache: new QueryCache({}),
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
