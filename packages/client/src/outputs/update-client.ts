import type * as models from '../index.ts';

export type UpdateClient = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type UpdateClient400 = models.ValidationError;
