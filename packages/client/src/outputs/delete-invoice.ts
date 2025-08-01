import type * as models from '../index.ts';

export type DeleteInvoice = { message: 'Invoice deleted successfully' };

export type DeleteInvoice400 = any | models.ValidationError;
