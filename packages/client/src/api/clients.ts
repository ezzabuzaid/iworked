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
import * as clients from '../inputs/clients.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'POST /api/clients': {
    schema: clients.createClientSchema,
    output: [
      http.Created<outputs.CreateClient201>,
      http.BadRequest<outputs.CreateClient400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof clients.createClientSchema>) {
      return toRequest(
        'POST /api/clients',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['name', 'email'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof clients.createClientSchema>,
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
  'GET /api/clients': {
    schema: clients.getClientsSchema,
    output: [
      http.Ok<outputs.GetClients>,
      http.BadRequest<outputs.GetClients400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof clients.getClientsSchema>) {
      return toRequest(
        'GET /api/clients',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['page', 'pageSize'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof clients.getClientsSchema>,
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
  'GET /api/clients/{id}': {
    schema: clients.getClientSchema,
    output: [
      http.Ok<outputs.GetClient>,
      http.BadRequest<outputs.GetClient400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.GetClient404>,
    ],
    toRequest(input: z.infer<typeof clients.getClientSchema>) {
      return toRequest(
        'GET /api/clients/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof clients.getClientSchema>,
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
  'PATCH /api/clients/{id}': {
    schema: clients.updateClientSchema,
    output: [
      http.Ok<outputs.UpdateClient>,
      http.BadRequest<outputs.UpdateClient400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.UpdateClient404>,
    ],
    toRequest(input: z.infer<typeof clients.updateClientSchema>) {
      return toRequest(
        'PATCH /api/clients/{id}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['name', 'email'],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof clients.updateClientSchema>,
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
