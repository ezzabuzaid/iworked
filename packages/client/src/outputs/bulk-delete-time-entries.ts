import type * as models from '../index.ts';

export type BulkDeleteTimeEntries = { message: string; deletedIds: string[] };

export type BulkDeleteTimeEntries400 = any | models.ValidationError;

export type BulkDeleteTimeEntries404 = {
  message: 'Some time entries were not found';
  cause: { code: 'api/entries-not-found'; detail: string };
};
