import type * as models from '../index.ts';

export type GetSummary =
  | {
      groupBy: 'client';
      dateRange: { startDate: string; endDate: string };
      summary: any[];
    }
  | {
      groupBy: 'project';
      dateRange: { startDate: string; endDate: string };
      summary: any[];
    };

export type GetSummary400 = any | models.ValidationError;
