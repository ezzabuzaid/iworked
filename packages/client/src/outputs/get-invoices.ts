import type * as models from '../index.ts';

export type GetInvoices = {
  data: {
    totalAmount: number;
    client: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
    invoiceLines: {
      id: string;
      description: string;
      projectId: string;
      hours: string;
      rate: string;
      amount: string;
      invoiceId: string;
    }[];
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    status: 'DRAFT' | 'SENT' | 'PAID';
    clientId: string;
    dateFrom: string;
    dateTo: string;
    sentAt: string;
    paidAt: string;
    paidAmount: string;
    pdfUrl: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type GetInvoices400 = models.ValidationError;
