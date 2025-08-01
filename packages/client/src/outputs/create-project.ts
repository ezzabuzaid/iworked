import type * as models from '../index.ts';

export type CreateProject201 = {
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

export type CreateProject400 = models.ValidationError;
