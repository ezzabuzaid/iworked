import type * as models from '../index.ts';

export type DeleteInvoiceLine = {
  message: 'Invoice line deleted successfully';
};

export type DeleteInvoiceLine400 = models.ValidationError;
