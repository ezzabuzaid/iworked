import type * as models from '../index.ts';

export type GetClient = {
  projects: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    description: string;
    hourlyRate: string;
    clientId: string;
  }[];
  _count: { invoices: number };
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type GetClient400 = models.ValidationError;

export type GetClient404 = { error: 'Client not found' };
