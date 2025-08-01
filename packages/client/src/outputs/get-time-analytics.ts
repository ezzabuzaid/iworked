import type * as models from '../index.ts';

export type GetTimeAnalytics = {
  groupBy: 'week' | 'month' | 'day';
  dateRange: { startDate: string; endDate: string };
  analytics: {
    period: any;
    totalHours: number;
    totalAmount: number;
    entriesCount: any;
    projectsCount: any;
    clientsCount: any;
    averageHoursPerEntry: number;
  }[];
  statistics: {
    totalPeriods: number;
    averageHoursPerPeriod: number;
    averageAmountPerPeriod: number;
    mostProductivePeriod: any;
  };
};

export type GetTimeAnalytics400 = models.ValidationError;
