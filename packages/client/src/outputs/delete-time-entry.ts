import type * as models from '../index.ts';

export type DeleteTimeEntry = { message: 'Time entry deleted successfully' };

export type DeleteTimeEntry400 = any | models.ValidationError;
