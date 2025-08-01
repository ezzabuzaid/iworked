import type * as models from '../index.ts';

export type ExportClientProjectsTimeEntries = { [key: string]: any };

export type ExportClientProjectsTimeEntries400 = models.ValidationError;

export type ExportClientProjectsTimeEntries404 =
  | { error: 'Client not found' }
  | {
      error: 'Some projects not found or do not belong to this client';
      missingProjectIds: string[];
    };
