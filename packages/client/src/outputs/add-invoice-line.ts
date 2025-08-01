import type * as models from '../index.ts';

export type AddInvoiceLine201 = {
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
};

export type AddInvoiceLine400 = models.ValidationError;
