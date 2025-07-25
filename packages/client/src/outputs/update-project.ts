import type * as models from '../index.ts';

export type UpdateProject =
  | {
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
      description: string;
      hourlyRate: string;
      clientId: string;
    }
  | {
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

export type UpdateProject400 = models.ValidationError;

export type UpdateProject404 = { error: 'Project not found' };
