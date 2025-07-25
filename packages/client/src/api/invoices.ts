import z from 'zod';

import {
  Dispatcher,
  type InstanceType,
  fetchType,
} from '../http/dispatcher.ts';
import {
  type Interceptor,
  createBaseUrlInterceptor,
  createHeadersInterceptor,
} from '../http/interceptors.ts';
import { buffered, chunked } from '../http/parse-response.ts';
import {
  type HeadersInit,
  createUrl,
  empty,
  formdata,
  json,
  toRequest,
  urlencoded,
} from '../http/request.ts';
import * as http from '../http/response.ts';
import * as invoices from '../inputs/invoices.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'POST /api/invoices': {
    schema: invoices.createInvoiceSchema,
    output: [
      http.Created<outputs.CreateInvoice201>,
      http.BadRequest<outputs.CreateInvoice400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.CreateInvoice404>,
    ],
    toRequest(input: z.infer<typeof invoices.createInvoiceSchema>) {
      return toRequest(
        'POST /api/invoices',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['clientId', 'dateFrom', 'dateTo'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof invoices.createInvoiceSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'GET /api/invoices': {
    schema: invoices.getInvoicesSchema,
    output: [
      http.Ok<outputs.GetInvoices>,
      http.BadRequest<outputs.GetInvoices400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof invoices.getInvoicesSchema>) {
      return toRequest(
        'GET /api/invoices',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['page', 'pageSize', 'status', 'clientId'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof invoices.getInvoicesSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'GET /api/invoices/{id}': {
    schema: invoices.getInvoiceSchema,
    output: [
      http.Ok<outputs.GetInvoice>,
      http.BadRequest<outputs.GetInvoice400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.GetInvoice404>,
    ],
    toRequest(input: z.infer<typeof invoices.getInvoiceSchema>) {
      return toRequest(
        'GET /api/invoices/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof invoices.getInvoiceSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'DELETE /api/invoices/{id}': {
    schema: invoices.deleteInvoiceSchema,
    output: [
      http.Ok<outputs.DeleteInvoice>,
      http.BadRequest<outputs.DeleteInvoice400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.DeleteInvoice404>,
    ],
    toRequest(input: z.infer<typeof invoices.deleteInvoiceSchema>) {
      return toRequest(
        'DELETE /api/invoices/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof invoices.deleteInvoiceSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'PATCH /api/invoices/{id}/status': {
    schema: invoices.updateInvoiceStatusSchema,
    output: [
      http.Ok<outputs.UpdateInvoiceStatus>,
      http.BadRequest<outputs.UpdateInvoiceStatus400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.UpdateInvoiceStatus404>,
    ],
    toRequest(input: z.infer<typeof invoices.updateInvoiceStatusSchema>) {
      return toRequest(
        'PATCH /api/invoices/{id}/status',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['status', 'paidAmount'],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof invoices.updateInvoiceStatusSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
  'POST /api/invoices/{id}/pdf': {
    schema: invoices.generateInvoicePdfSchema,
    output: [
      http.Ok<outputs.GenerateInvoicePdf>,
      http.BadRequest<outputs.GenerateInvoicePdf400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.GenerateInvoicePdf404>,
    ],
    toRequest(input: z.infer<typeof invoices.generateInvoicePdfSchema>) {
      return toRequest(
        'POST /api/invoices/{id}/pdf',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof invoices.generateInvoicePdfSchema>,
      options: {
        signal?: AbortSignal;
        interceptors: Interceptor[];
        fetch: z.infer<typeof fetchType>;
      },
    ) {
      const dispatcher = new Dispatcher(options.interceptors, options.fetch);
      const result = await dispatcher.send(this.toRequest(input), this.output);
      return result.data;
    },
  },
};
