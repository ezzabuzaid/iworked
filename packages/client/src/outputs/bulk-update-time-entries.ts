import type * as models from '../index.ts';

export type BulkUpdateTimeEntries =
  | { message: 'No updates provided'; updatedCount: number }
  | { message: string; updatedCount: number };

export type BulkUpdateTimeEntries400 = any | models.ValidationError;

export type BulkUpdateTimeEntries404 = {
  message: 'Some time entries were not found';
  cause: { code: 'api/entries-not-found'; detail: string };
};
