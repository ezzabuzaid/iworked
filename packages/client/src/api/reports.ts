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
import * as reports from '../inputs/reports.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'GET /api/reports/summary': {
    schema: reports.getSummarySchema,
    output: [
      http.Ok<outputs.GetSummary>,
      http.BadRequest<outputs.GetSummary400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.getSummarySchema>) {
      return toRequest(
        'GET /api/reports/summary',
        empty(input, {
          inputHeaders: [],
          inputQuery: [
            'startDate',
            'endDate',
            'groupBy',
            'clientId',
            'projectId',
          ],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.getSummarySchema>,
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
  'GET /api/reports/detailed': {
    schema: reports.getDetailedReportSchema,
    output: [
      http.Ok<outputs.GetDetailedReport>,
      http.BadRequest<outputs.GetDetailedReport400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.getDetailedReportSchema>) {
      return toRequest(
        'GET /api/reports/detailed',
        empty(input, {
          inputHeaders: [],
          inputQuery: [
            'startDate',
            'endDate',
            'clientId',
            'projectId',
            'page',
            'pageSize',
          ],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.getDetailedReportSchema>,
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
  'GET /api/reports/dashboard': {
    schema: reports.getDashboardSchema,
    output: [
      http.Ok<outputs.GetDashboard>,
      http.BadRequest<outputs.GetDashboard400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.getDashboardSchema>) {
      return toRequest(
        'GET /api/reports/dashboard',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['period'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.getDashboardSchema>,
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
  'GET /api/reports/time-analytics': {
    schema: reports.getTimeAnalyticsSchema,
    output: [
      http.Ok<outputs.GetTimeAnalytics>,
      http.BadRequest<outputs.GetTimeAnalytics400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.getTimeAnalyticsSchema>) {
      return toRequest(
        'GET /api/reports/time-analytics',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['startDate', 'endDate', 'groupBy'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.getTimeAnalyticsSchema>,
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
  'GET /api/reports/productivity': {
    schema: reports.getProductivityMetricsSchema,
    output: [
      http.Ok<outputs.GetProductivityMetrics>,
      http.BadRequest<outputs.GetProductivityMetrics400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.getProductivityMetricsSchema>) {
      return toRequest(
        'GET /api/reports/productivity',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['startDate', 'endDate'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.getProductivityMetricsSchema>,
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
  'GET /api/reports/export/time-entries': {
    schema: reports.exportTimeEntriesSchema,
    output: [
      http.Ok<outputs.ExportTimeEntries>,
      http.BadRequest<outputs.ExportTimeEntries400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.exportTimeEntriesSchema>) {
      return toRequest(
        'GET /api/reports/export/time-entries',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['startDate', 'endDate', 'clientId', 'projectId'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.exportTimeEntriesSchema>,
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
  'GET /api/reports/export/invoices': {
    schema: reports.exportInvoicesSchema,
    output: [
      http.Ok<outputs.ExportInvoices>,
      http.BadRequest<outputs.ExportInvoices400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.exportInvoicesSchema>) {
      return toRequest(
        'GET /api/reports/export/invoices',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['status', 'clientId'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.exportInvoicesSchema>,
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
  'GET /api/reports/export/clients/{clientId}/time-entries': {
    schema: reports.exportClientTimeEntriesSchema,
    output: [
      http.Ok<outputs.ExportClientTimeEntries>,
      http.BadRequest<outputs.ExportClientTimeEntries400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof reports.exportClientTimeEntriesSchema>) {
      return toRequest(
        'GET /api/reports/export/clients/{clientId}/time-entries',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['startDate', 'endDate'],
          inputBody: [],
          inputParams: ['clientId'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.exportClientTimeEntriesSchema>,
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
  'GET /api/reports/export/projects/{projectId}/time-entries': {
    schema: reports.exportProjectTimeEntriesSchema,
    output: [
      http.Ok<outputs.ExportProjectTimeEntries>,
      http.BadRequest<outputs.ExportProjectTimeEntries400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.ExportProjectTimeEntries404>,
    ],
    toRequest(input: z.infer<typeof reports.exportProjectTimeEntriesSchema>) {
      return toRequest(
        'GET /api/reports/export/projects/{projectId}/time-entries',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['startDate', 'endDate'],
          inputBody: [],
          inputParams: ['projectId'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.exportProjectTimeEntriesSchema>,
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
  'POST /api/reports/export/clients/{clientId}/projects/time-entries': {
    schema: reports.exportClientProjectsTimeEntriesSchema,
    output: [
      http.Ok<outputs.ExportClientProjectsTimeEntries>,
      http.BadRequest<outputs.ExportClientProjectsTimeEntries400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.ExportClientProjectsTimeEntries404>,
    ],
    toRequest(
      input: z.infer<typeof reports.exportClientProjectsTimeEntriesSchema>,
    ) {
      return toRequest(
        'POST /api/reports/export/clients/{clientId}/projects/time-entries',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['projectIds', 'startDate', 'endDate'],
          inputParams: ['clientId'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof reports.exportClientProjectsTimeEntriesSchema>,
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
