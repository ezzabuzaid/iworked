import type * as models from '../index.ts';

export type GetProject = {
  client: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
  };
  _count: { timeEntries: number };
  timeEntries: {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    startedAt: string;
    endedAt: string;
    note: string;
    isLocked: boolean;
    projectId: string;
  }[];
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  description: string;
  hourlyRate: string;
  clientId: string;
};

export type GetProject400 = models.ValidationError;
