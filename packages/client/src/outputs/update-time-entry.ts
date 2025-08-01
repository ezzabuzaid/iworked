import type * as models from '../index.ts';

export type UpdateTimeEntry =
  | {
      id: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
      startedAt: string;
      endedAt: string;
      note: string;
      isLocked: boolean;
      projectId: string;
    }
  | {
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
    };

export type UpdateTimeEntry400 = any | models.ValidationError;
