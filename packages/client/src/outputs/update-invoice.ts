import type * as models from '../index.ts';

export type UpdateInvoice =
  | {
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
      invoiceNumber: string;
      dateFrom: string;
      dateTo: string;
      sentAt: string;
      paidAt: string;
      paidAmount: string;
      pdfUrl: string;
      notes: string;
    }
  | {
      client: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
      };
      invoiceLines: {
        project: {
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
      invoiceNumber: string;
      dateFrom: string;
      dateTo: string;
      sentAt: string;
      paidAt: string;
      paidAmount: string;
      pdfUrl: string;
      notes: string;
    };

export type UpdateInvoice400 = any | models.ValidationError;
