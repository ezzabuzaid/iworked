import type * as models from '../index.ts';

export type GetTimeEntries = {
  data: {
    project: {
      client: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
      };
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
      description: string;
      hourlyRate: string;
      clientId: string;
    };
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
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type GetTimeEntries400 = models.ValidationError;
