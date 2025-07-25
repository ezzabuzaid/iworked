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
};
