import type * as models from '../index.ts';

export type GetDetailedReport = {
  data: {
    durationHours: number;
    amount: number;
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
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  totals: { totalHours: number; totalAmount: number };
  dateRange: { startDate: string; endDate: string };
};

export type GetDetailedReport400 = models.ValidationError;
