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
import * as projects from '../inputs/projects.ts';
import * as outputs from '../outputs/index.ts';
import {
  CursorPagination,
  OffsetPagination,
  Pagination,
} from '../pagination/index.ts';

export default {
  'POST /api/projects': {
    schema: projects.createProjectSchema,
    output: [
      http.Created<outputs.CreateProject201>,
      http.BadRequest<outputs.CreateProject400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.CreateProject404>,
    ],
    toRequest(input: z.infer<typeof projects.createProjectSchema>) {
      return toRequest(
        'POST /api/projects',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['name', 'description', 'hourlyRate', 'clientId'],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof projects.createProjectSchema>,
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
  'GET /api/projects': {
    schema: projects.getProjectsSchema,
    output: [
      http.Ok<outputs.GetProjects>,
      http.BadRequest<outputs.GetProjects400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
    ],
    toRequest(input: z.infer<typeof projects.getProjectsSchema>) {
      return toRequest(
        'GET /api/projects',
        empty(input, {
          inputHeaders: [],
          inputQuery: ['page', 'pageSize', 'clientId'],
          inputBody: [],
          inputParams: [],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof projects.getProjectsSchema>,
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
  'GET /api/projects/{id}': {
    schema: projects.getProjectSchema,
    output: [
      http.Ok<outputs.GetProject>,
      http.BadRequest<outputs.GetProject400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.GetProject404>,
    ],
    toRequest(input: z.infer<typeof projects.getProjectSchema>) {
      return toRequest(
        'GET /api/projects/{id}',
        empty(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: [],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof projects.getProjectSchema>,
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
  'PATCH /api/projects/{id}': {
    schema: projects.updateProjectSchema,
    output: [
      http.Ok<outputs.UpdateProject>,
      http.BadRequest<outputs.UpdateProject400>,
      http.Unauthorized<outputs.UnauthorizedErr>,
      http.NotFound<outputs.UpdateProject404>,
    ],
    toRequest(input: z.infer<typeof projects.updateProjectSchema>) {
      return toRequest(
        'PATCH /api/projects/{id}',
        json(input, {
          inputHeaders: [],
          inputQuery: [],
          inputBody: ['name', 'description', 'hourlyRate'],
          inputParams: ['id'],
        }),
      );
    },
    async dispatch(
      input: z.infer<typeof projects.updateProjectSchema>,
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
