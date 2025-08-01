import type * as models from '../index.ts';

export type GetProductivityMetrics = {
  dateRange: { startDate: string; endDate: string };
  totalDays: number;
  productivity: {
    totalHours: number;
    totalAmount: number;
    averageHoursPerDay: number;
    averageSessionDuration: number;
    totalSessions: number;
    uniqueProjects: number;
    uniqueClients: number;
    dailyDistribution: { day: string; hours: number; percentage: number }[];
    topProjects: {
      name: any;
      client: any;
      hours: number;
      amount: number;
      percentage: number;
    }[];
    topClients: {
      name: any;
      hours: number;
      amount: number;
      projectsCount: number;
      percentage: number;
    }[];
    peakHours: { hour: number; hours: number }[];
  };
};

export type GetProductivityMetrics400 = models.ValidationError;
