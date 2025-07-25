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
import * as timeEntries from '../inputs/time-entries.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'POST /api/time-entries': {
    schema: timeEntries.createTimeEntrySchema,
    output: [
      http.Created<outputs.CreateTimeEntry201>,
      http.BadRequest<outputs.CreateTimeEntry400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.CreateTimeEntry404>,
    ],
    toRequest(input: z.infer<typeof timeEntries.createTimeEntrySchema>) {
      return toRequest(
        'POST /api/time-entries',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['startedAt', 'endedAt', 'note', 'projectId'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof timeEntries.createTimeEntrySchema>,
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
  'GET /api/time-entries': {
    schema: timeEntries.getTimeEntriesSchema,
    output: [
      http.Ok<outputs.GetTimeEntries>,
      http.BadRequest<outputs.GetTimeEntries400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof timeEntries.getTimeEntriesSchema>) {
      return toRequest(
        'GET /api/time-entries',
        empty(input, {
          inputHeaders: [],
          inputQuery: [
            'page',
            'pageSize',
            'projectId',
            'clientId',
            'startDate',
            'endDate',
          ],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof timeEntries.getTimeEntriesSchema>,
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
  'GET /api/time-entries/{id}': {
    schema: timeEntries.getTimeEntrySchema,
    output: [
      http.Ok<outputs.GetTimeEntry>,
      http.BadRequest<outputs.GetTimeEntry400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.GetTimeEntry404>,
    ],
    toRequest(input: z.infer<typeof timeEntries.getTimeEntrySchema>) {
      return toRequest(
        'GET /api/time-entries/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof timeEntries.getTimeEntrySchema>,
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
  'PATCH /api/time-entries/{id}': {
    schema: timeEntries.updateTimeEntrySchema,
    output: [
      http.Ok<outputs.UpdateTimeEntry>,
      http.BadRequest<outputs.UpdateTimeEntry400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.UpdateTimeEntry404>,
    ],
    toRequest(input: z.infer<typeof timeEntries.updateTimeEntrySchema>) {
      return toRequest(
        'PATCH /api/time-entries/{id}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['startedAt', 'endedAt', 'note'],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof timeEntries.updateTimeEntrySchema>,
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
  'DELETE /api/time-entries/{id}': {
    schema: timeEntries.deleteTimeEntrySchema,
    output: [
      http.Ok<outputs.DeleteTimeEntry>,
      http.BadRequest<outputs.DeleteTimeEntry400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.DeleteTimeEntry404>,
    ],
    toRequest(input: z.infer<typeof timeEntries.deleteTimeEntrySchema>) {
      return toRequest(
        'DELETE /api/time-entries/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof timeEntries.deleteTimeEntrySchema>,
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
