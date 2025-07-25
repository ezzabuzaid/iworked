import type * as models from '../index.ts';

export type GetInvoice = {
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
  dateFrom: string;
  dateTo: string;
  sentAt: string;
  paidAt: string;
  paidAmount: string;
  pdfUrl: string;
};

export type GetInvoice400 = models.ValidationError;

export type GetInvoice404 = { error: 'Invoice not found' };
