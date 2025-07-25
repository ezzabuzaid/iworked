import type * as models from '../index.ts';

export type GenerateInvoicePdf = {
  pdfUrl: string;
  message: 'PDF generation initiated';
};

export type GenerateInvoicePdf400 = models.ValidationError;

export type GenerateInvoicePdf404 = { error: 'Invoice not found' };
