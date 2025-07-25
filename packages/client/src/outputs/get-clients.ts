import type * as models from '../index.ts';

export type GetClients = {
  data: {
    _count: { projects: number; invoices: number };
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type GetClients400 = models.ValidationError;
