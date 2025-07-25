import type * as models from '../index.ts';

export type CreateClient201 = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type CreateClient400 = models.ValidationError;
