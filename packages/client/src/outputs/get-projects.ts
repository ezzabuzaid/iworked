import type * as models from '../index.ts';

export type GetProjects = {
  data: {
    client: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
    _count: { timeEntries: number };
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    description: string;
    hourlyRate: string;
    clientId: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type GetProjects400 = models.ValidationError;
