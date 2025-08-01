import type * as models from '../index.ts';

export type ExportProjectTimeEntries = { [key: string]: any };

export type ExportProjectTimeEntries400 = models.ValidationError;

export type ExportProjectTimeEntries404 = { error: 'Project not found' };
