import type * as models from '../index.ts';

export type GetDashboard = {
  period: 'week' | 'month' | 'quarter' | 'year';
  dateRange: { startDate: string; endDate: string };
  metrics: {
    totalHours: number;
    totalAmount: number;
    totalInvoiced: number;
    totalPaid: number;
    pendingAmount: number;
    activeProjects: number;
    activeClients: number;
    timeEntriesCount: number;
    invoicesCount: number;
    invoicesByStatus: { [key: string]: number };
  };
};

export type GetDashboard400 = models.ValidationError;
