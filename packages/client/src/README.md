# IWorked API TypeScript SDK

A fully-typed TypeScript SDK with comprehensive IntelliSense support, automatic request/response validation, and modern async/await patterns. Built for seamless integration with TypeScript and JavaScript projects. Each endpoint includes a brief description, example usage, and details about request and response formats.

## Installation

```bash
npm install @iworked/sdk
```

## Basic Usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});
```

### Configuration Options

| Option    | Type               | Required | Description                                   |
| --------- | ------------------ | -------- | --------------------------------------------- |
| `fetch`   | `fetch compatible` | No       | Fetch implementation to use for HTTP requests |
| `baseUrl` | `string`           | No       | API base URL (default: `/`)                   |
| `token`   | `string`           | No       | Bearer token for authentication               |

### Updating Configuration

You can update client configuration after initialization using the `setOptions` method:

```typescript
// Initial client setup
const iWorked = new IWorked({
  baseUrl: 'https://api.production-service.com',
  token: 'prod_sk_1234567890abcdef',
});

// Later, update specific options
client.setOptions({
  baseUrl: 'https://api.staging-service.com',
  token: 'staging_sk_abcdef1234567890',
});
```

The `setOptions` method validates the provided options and only updates the specified fields, leaving other configuration unchanged.

## Authentication

The SDK requires authentication to access the API. Configure your client with the required credentials:

### Bearer Token

Pass your bearer token directly - the "Bearer" prefix is automatically added:

```typescript
const iWorked = new IWorked({
  token: 'sk_live_51234567890abcdef1234567890abcdef',
});
```

## Error Handling

The SDK provides structured error handling with typed HTTP error responses.

### Error Response Types

All API errors extend from `APIError` and include the HTTP status code and response data:

```typescript
import {
  BadRequest,
  InternalServerError,
  NotFound,
  ParseError,
  TooManyRequests,
  Unauthorized,
} from '@iworked/sdk';

try {
  const usersList = await iWorked.request('GET /users', {});
  // Handle successful response
} catch (error) {
  // Handle different error types
  if (error instanceof BadRequest) {
    console.error('Bad request:', error.data);
    console.log('Status:', error.status); // 400
  } else if (error instanceof Unauthorized) {
    console.error('Authentication failed:', error.data);
    console.log('Status:', error.status); // 401
  } else if (error instanceof NotFound) {
    console.error('Resource not found:', error.data);
    console.log('Status:', error.status); // 404
  } else if (error instanceof TooManyRequests) {
    console.error('Rate limited:', error.data);
    if (error.data.retryAfter) {
      console.log('Retry after:', error.data.retryAfter);
    }
  } else if (error instanceof InternalServerError) {
    console.error('Server error:', error.data);
    console.log('Status:', error.status); // 500
  } else if (error instanceof ParseError) {
    console.error('Input validation failed:', error.data);
  }
}
```

### Available Error Classes

#### Input Validation Errors

- `ParseError` - Request input validation failed against API schema

#### Client Errors (4xx)

- `BadRequest` (400) - Invalid request data
- `Unauthorized` (401) - Authentication required
- `PaymentRequired` (402) - Payment required
- `Forbidden` (403) - Access denied
- `NotFound` (404) - Resource not found
- `MethodNotAllowed` (405) - HTTP method not allowed
- `NotAcceptable` (406) - Content type not acceptable
- `Conflict` (409) - Resource conflict
- `Gone` (410) - Resource no longer available
- `PreconditionFailed` (412) - Precondition failed
- `PayloadTooLarge` (413) - Request payload too large
- `UnsupportedMediaType` (415) - Unsupported content type
- `UnprocessableEntity` (422) - Validation errors
- `TooManyRequests` (429) - Rate limit exceeded

#### Server Errors (5xx)

- `InternalServerError` (500) - Server error
- `NotImplemented` (501) - Not implemented
- `BadGateway` (502) - Bad gateway
- `ServiceUnavailable` (503) - Service unavailable
- `GatewayTimeout` (504) - Gateway timeout

### Validation Errors

Validation errors (422) include detailed field-level error information:

### Input Validation Errors

When request input fails validation against the API schema, a `ParseError` is thrown:

```typescript
import { ParseError } from '@iworked/sdk';

try {
  // Invalid input that doesn't match the expected schema
  const newUser = await iWorked.request('POST /users', {
    email: 123,
    firstName: '',
    age: -5,
  });
} catch (error) {
  if (error instanceof ParseError) {
    console.log('Input validation failed:');

    // Field-level errors
    if (error.data.fieldErrors) {
      Object.entries(error.data.fieldErrors).forEach(
        ([fieldName, validationIssues]) => {
          console.log(
            `  ${fieldName}: ${validationIssues.map((issue) => issue.message).join(', ')}`,
          );
        },
      );
    }

    // Form-level errors
    if (error.data.formErrors.length > 0) {
      console.log(
        `  Form errors: ${error.data.formErrors.map((issue) => issue.message).join(', ')}`,
      );
    }
  }
}
```

`ParseError` contains detailed validation information using Zod's flattened error format, providing specific field-level and form-level validation messages.

### Rate Limiting

Rate limit responses may include a `retryAfter` field indicating when to retry:

```typescript
import { TooManyRequests } from '@iworked/sdk';

try {
  const apiResponse = await iWorked.request('GET /api/data', {});
} catch (error) {
  if (error instanceof TooManyRequests) {
    const retryAfterSeconds = error.data.retryAfter;
    if (retryAfterSeconds) {
      console.log(`Rate limited. Retry after: ${retryAfterSeconds} seconds`);
      // Implement your own retry logic
      setTimeout(() => {
        // Retry the request
      }, retryAfterSeconds * 1000);
    }
  }
}
```

## API Reference

### createClient | _POST /api/clients_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('POST /api/clients', {
  name: 'example',
  email: 'user@example.com',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`CreateClient`](#createclient)

#### Output

**201** - Response for 201

**Content Type:** `application/json`

**Type:** [`CreateClient201`](#createclient201)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`CreateClient400`](#createclient400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getClients | _GET /api/clients_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/clients', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetClientsInput`](#getclientsinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetClients`](#getclients)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetClients400`](#getclients400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getClient | _GET /api/clients/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/clients/{id}', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetClientInput`](#getclientinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetClient`](#getclient)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetClient400`](#getclient400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### updateClient | _PATCH /api/clients/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('PATCH /api/clients/{id}', {
  name: 'example',
  email: 'user@example.com',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`UpdateClientInput`](#updateclientinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`UpdateClient`](#updateclient)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`UpdateClient400`](#updateclient400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### createProject | _POST /api/projects_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('POST /api/projects', {
  name: 'example',
  description: 'example',
  clientId: '123e4567-e89b-12d3-a456-426614174000',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`CreateProject`](#createproject)

#### Output

**201** - Response for 201

**Content Type:** `application/json`

**Type:** [`CreateProject201`](#createproject201)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`CreateProject400`](#createproject400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getProjects | _GET /api/projects_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/projects', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetProjectsInput`](#getprojectsinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetProjects`](#getprojects)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetProjects400`](#getprojects400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getProject | _GET /api/projects/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/projects/{id}', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetProjectInput`](#getprojectinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetProject`](#getproject)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetProject400`](#getproject400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### updateProject | _PATCH /api/projects/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('PATCH /api/projects/{id}', {
  description: 'example',
  hourlyRate: 1,
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`UpdateProjectInput`](#updateprojectinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`UpdateProject`](#updateproject)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`UpdateProject400`](#updateproject400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### createTimeEntry | _POST /api/time-entries_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('POST /api/time-entries', {
  startedAt: '2025-07-17T09:08:00.097Z',
  endedAt: '2025-07-17T09:08:00.097Z',
  projectId: '123e4567-e89b-12d3-a456-426614174000',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`CreateTimeEntry`](#createtimeentry)

#### Output

**201** - Response for 201

**Content Type:** `application/json`

**Type:** [`CreateTimeEntry201`](#createtimeentry201)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`CreateTimeEntry400`](#createtimeentry400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getTimeEntries | _GET /api/time-entries_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/time-entries', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetTimeEntriesInput`](#gettimeentriesinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetTimeEntries`](#gettimeentries)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetTimeEntries400`](#gettimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getTimeEntry | _GET /api/time-entries/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/time-entries/{id}', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetTimeEntryInput`](#gettimeentryinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetTimeEntry`](#gettimeentry)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetTimeEntry400`](#gettimeentry400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### updateTimeEntry | _PATCH /api/time-entries/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('PATCH /api/time-entries/{id}', {
  endedAt: '2025-07-17T09:08:00.097Z',
  note: 'example',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`UpdateTimeEntryInput`](#updatetimeentryinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`UpdateTimeEntry`](#updatetimeentry)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`UpdateTimeEntry400`](#updatetimeentry400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### deleteTimeEntry | _DELETE /api/time-entries/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('DELETE /api/time-entries/{id}', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`DeleteTimeEntryInput`](#deletetimeentryinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`DeleteTimeEntry`](#deletetimeentry)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`DeleteTimeEntry400`](#deletetimeentry400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### bulkCreateTimeEntries | _POST /api/time-entries/bulk_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('POST /api/time-entries/bulk', {
  entries: [
    {
      startedAt: '2025-07-17T09:08:00.097Z',
      endedAt: '2025-07-17T09:08:00.097Z',
      note: 'example',
      projectId: '123e4567-e89b-12d3-a456-426614174000',
    },
  ],
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`BulkCreateTimeEntries`](#bulkcreatetimeentries)

#### Output

**201** - Response for 201

**Content Type:** `application/json`

**Type:** [`BulkCreateTimeEntries201`](#bulkcreatetimeentries201)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`BulkCreateTimeEntries400`](#bulkcreatetimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### bulkDeleteTimeEntries | _DELETE /api/time-entries/bulk_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('DELETE /api/time-entries/bulk', {
  ids: ['123e4567-e89b-12d3-a456-426614174000'],
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`BulkDeleteTimeEntriesInput`](#bulkdeletetimeentriesinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`BulkDeleteTimeEntries`](#bulkdeletetimeentries)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`BulkDeleteTimeEntries400`](#bulkdeletetimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

**404** - Response for 404

**Content Type:** `application/json`

**Type:** [`BulkDeleteTimeEntries404`](#bulkdeletetimeentries404)

### bulkUpdateTimeEntries | _PATCH /api/time-entries/bulk_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('PATCH /api/time-entries/bulk', {
  ids: ['123e4567-e89b-12d3-a456-426614174000'],
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`BulkUpdateTimeEntriesInput`](#bulkupdatetimeentriesinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`BulkUpdateTimeEntries`](#bulkupdatetimeentries)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`BulkUpdateTimeEntries400`](#bulkupdatetimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

**404** - Response for 404

**Content Type:** `application/json`

**Type:** [`BulkUpdateTimeEntries404`](#bulkupdatetimeentries404)

### getSummary | _GET /api/reports/summary_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/reports/summary', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetSummaryInput`](#getsummaryinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetSummary`](#getsummary)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetSummary400`](#getsummary400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getDetailedReport | _GET /api/reports/detailed_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/reports/detailed', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetDetailedReportInput`](#getdetailedreportinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetDetailedReport`](#getdetailedreport)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetDetailedReport400`](#getdetailedreport400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getDashboard | _GET /api/reports/dashboard_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/reports/dashboard', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetDashboardInput`](#getdashboardinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetDashboard`](#getdashboard)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetDashboard400`](#getdashboard400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getTimeAnalytics | _GET /api/reports/time-analytics_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/reports/time-analytics', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetTimeAnalyticsInput`](#gettimeanalyticsinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetTimeAnalytics`](#gettimeanalytics)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetTimeAnalytics400`](#gettimeanalytics400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getProductivityMetrics | _GET /api/reports/productivity_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/reports/productivity', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetProductivityMetricsInput`](#getproductivitymetricsinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetProductivityMetrics`](#getproductivitymetrics)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetProductivityMetrics400`](#getproductivitymetrics400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### exportTimeEntries | _GET /api/reports/export/time-entries_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request(
  'GET /api/reports/export/time-entries',
  {},
);

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`ExportTimeEntriesInput`](#exporttimeentriesinput)

#### Output

**200** - OK

**Content Type:** `application/json`

**Type:** [`ExportTimeEntries`](#exporttimeentries)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`ExportTimeEntries400`](#exporttimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### exportInvoices | _GET /api/reports/export/invoices_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/reports/export/invoices', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`ExportInvoicesInput`](#exportinvoicesinput)

#### Output

**200** - OK

**Content Type:** `application/json`

**Type:** [`ExportInvoices`](#exportinvoices)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`ExportInvoices400`](#exportinvoices400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### exportClientTimeEntries | _GET /api/reports/export/clients/{clientId}/time-entries_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request(
  'GET /api/reports/export/clients/{clientId}/time-entries',
  {},
);

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`ExportClientTimeEntriesInput`](#exportclienttimeentriesinput)

#### Output

**200** - OK

**Content Type:** `application/json`

**Type:** [`ExportClientTimeEntries`](#exportclienttimeentries)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`ExportClientTimeEntries400`](#exportclienttimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### exportProjectTimeEntries | _GET /api/reports/export/projects/{projectId}/time-entries_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request(
  'GET /api/reports/export/projects/{projectId}/time-entries',
  {},
);

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`ExportProjectTimeEntriesInput`](#exportprojecttimeentriesinput)

#### Output

**200** - OK

**Content Type:** `application/json`

**Type:** [`ExportProjectTimeEntries`](#exportprojecttimeentries)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`ExportProjectTimeEntries400`](#exportprojecttimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

**404** - Response for 404

**Content Type:** `application/json`

**Type:** [`ExportProjectTimeEntries404`](#exportprojecttimeentries404)

### exportClientProjectsTimeEntries | _POST /api/reports/export/clients/{clientId}/projects/time-entries_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request(
  'POST /api/reports/export/clients/{clientId}/projects/time-entries',
  {
    projectIds: ['123e4567-e89b-12d3-a456-426614174000'],
    startDate: '2025-07-17T09:08:00.097Z',
    endDate: '2025-07-17T09:08:00.097Z',
  },
);

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`ExportClientProjectsTimeEntriesInput`](#exportclientprojectstimeentriesinput)

#### Output

**200** - OK

**Content Type:** `application/json`

**Type:** [`ExportClientProjectsTimeEntries`](#exportclientprojectstimeentries)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`ExportClientProjectsTimeEntries400`](#exportclientprojectstimeentries400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

**404** - Response for 404

**Content Type:** `application/json`

**Type:** [`ExportClientProjectsTimeEntries404`](#exportclientprojectstimeentries404)

### createInvoice | _POST /api/invoices_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('POST /api/invoices', {
  clientId: '123e4567-e89b-12d3-a456-426614174000',
  dateFrom: '2025-07-17T09:08:00.097Z',
  dateTo: '2025-07-17T09:08:00.097Z',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`CreateInvoice`](#createinvoice)

#### Output

**201** - Response for 201

**Content Type:** `application/json`

**Type:** [`CreateInvoice201`](#createinvoice201)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`CreateInvoice400`](#createinvoice400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getInvoices | _GET /api/invoices_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/invoices', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetInvoicesInput`](#getinvoicesinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetInvoices`](#getinvoices)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetInvoices400`](#getinvoices400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### getInvoice | _GET /api/invoices/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('GET /api/invoices/{id}', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GetInvoiceInput`](#getinvoiceinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GetInvoice`](#getinvoice)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GetInvoice400`](#getinvoice400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### deleteInvoice | _DELETE /api/invoices/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('DELETE /api/invoices/{id}', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`DeleteInvoiceInput`](#deleteinvoiceinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`DeleteInvoice`](#deleteinvoice)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`DeleteInvoice400`](#deleteinvoice400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### updateInvoice | _PATCH /api/invoices/{id}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('PATCH /api/invoices/{id}', {
  dateTo: '2025-07-17T09:08:00.097Z',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`UpdateInvoiceInput`](#updateinvoiceinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`UpdateInvoice`](#updateinvoice)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`UpdateInvoice400`](#updateinvoice400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### updateInvoiceStatus | _PATCH /api/invoices/{id}/status_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('PATCH /api/invoices/{id}/status', {
  status: 'SENT',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`UpdateInvoiceStatusInput`](#updateinvoicestatusinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`UpdateInvoiceStatus`](#updateinvoicestatus)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`UpdateInvoiceStatus400`](#updateinvoicestatus400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### generateInvoicePdf | _POST /api/invoices/{id}/pdf_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('POST /api/invoices/{id}/pdf', {});

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`GenerateInvoicePdfInput`](#generateinvoicepdfinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`GenerateInvoicePdf`](#generateinvoicepdf)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`GenerateInvoicePdf400`](#generateinvoicepdf400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### updateInvoiceLine | _PATCH /api/invoices/{id}/lines/{lineId}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request(
  'PATCH /api/invoices/{id}/lines/{lineId}',
  {
    description: 'example',
    hours: 1,
    rate: 1,
  },
);

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`UpdateInvoiceLineInput`](#updateinvoicelineinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`UpdateInvoiceLine`](#updateinvoiceline)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`UpdateInvoiceLine400`](#updateinvoiceline400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### deleteInvoiceLine | _DELETE /api/invoices/{id}/lines/{lineId}_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request(
  'DELETE /api/invoices/{id}/lines/{lineId}',
  {},
);

console.log(result.data);
```

#### Input

Content Type: `application/empty`

**Type:** [`DeleteInvoiceLineInput`](#deleteinvoicelineinput)

#### Output

**200** - Response for 200

**Content Type:** `application/json`

**Type:** [`DeleteInvoiceLine`](#deleteinvoiceline)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`DeleteInvoiceLine400`](#deleteinvoiceline400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

### addInvoiceLine | _POST /api/invoices/{id}/lines_

#### Example usage

```typescript
import { IWorked } from '@iworked/sdk';

const iWorked = new IWorked({
  baseUrl: '/',
  token: '"<token>"',
});

const result = await iWorked.request('POST /api/invoices/{id}/lines', {
  description: 'example',
  hours: 1,
  rate: 1,
  projectId: '123e4567-e89b-12d3-a456-426614174000',
});

console.log(result.data);
```

#### Input

Content Type: `application/json`

**Type:** [`AddInvoiceLine`](#addinvoiceline)

#### Output

**201** - Response for 201

**Content Type:** `application/json`

**Type:** [`AddInvoiceLine201`](#addinvoiceline201)

**400** - Bad Request

**Content Type:** `application/json`

**Type:** [`AddInvoiceLine400`](#addinvoiceline400)

**401** - Unauthorized

**Content Type:** `application/json`

**Type:** [`UnauthorizedErr`](#unauthorizederr)

## Schemas

<details>

<summary><h3 id="unauthorizederr">UnauthorizedErr</h3></summary>

**Type:** `object`

**Properties:**

- `error` `string` default: "Unauthorized":

</details>

<details>

<summary><h3 id="jsonvalue">JsonValue</h3></summary>

**Type:** `object`

**Additional Properties:**

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `string`

- **Option 2:**

**Type:** `number`

- **Option 3:**

**Type:** `boolean`

- **Option 4:**

**Type:** `unknown`

- **Option 5:**

**Type:** `object`

- **Option 6:**

**Type:** `array`

**Array items:**

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `string`

- **Option 2:**

**Type:** `number`

- **Option 3:**

**Type:** `boolean`

- **Option 4:**

**Type:** `unknown`

- **Option 5:**

**Type:** `object`

</details>

<details>

<summary><h3 id="createclient201">CreateClient201</h3></summary>

**Type:** `object`

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

</details>

<details>

<summary><h3 id="createclient400">CreateClient400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="createclient">CreateClient</h3></summary>

**Type:** `object`

**Properties:**

- `name` `string` required:

- Minimum length: 1

- Maximum length: 255

- `email` `string` (format: email):

</details>

<details>

<summary><h3 id="getclients">GetClients</h3></summary>

**Type:** `object`

**Properties:**

- `data` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `_count` `object`:

**Properties:**

- `projects` `number` required:

- `invoices` `number` required:

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `pagination` `object` required:

**Properties:**

- `page` `number` required:

- `pageSize` `number` required:

- `totalCount` `number` required:

- `totalPages` `number` required:

</details>

<details>

<summary><h3 id="getclients400">GetClients400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getclientsinput">GetClientsInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="getclient">GetClient</h3></summary>

**Type:** `object`

**Properties:**

- `projects` `array`:

**Array items:**

**Type:** `object`

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `_count` `object`:

**Properties:**

- `invoices` `number` required:

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

</details>

<details>

<summary><h3 id="getclient400">GetClient400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getclientinput">GetClientInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="updateclient">UpdateClient</h3></summary>

**Type:** `object`

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

</details>

<details>

<summary><h3 id="updateclient400">UpdateClient400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="updateclientinput">UpdateClientInput</h3></summary>

**Type:** `object`

**Properties:**

- `name` `string`:

- Minimum length: 1

- Maximum length: 255

- `email` `string` (format: email):

</details>

<details>

<summary><h3 id="createproject201">CreateProject201</h3></summary>

**Type:** `object`

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

</details>

<details>

<summary><h3 id="createproject400">CreateProject400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="createproject">CreateProject</h3></summary>

**Type:** `object`

**Properties:**

- `name` `string` required:

- Minimum length: 1

- Maximum length: 255

- `description` `string`:

- `hourlyRate` `number`:

- Must be strictly greater than: 0

- `clientId` `string` (format: uuid) required:

</details>

<details>

<summary><h3 id="getprojects">GetProjects</h3></summary>

**Type:** `object`

**Properties:**

- `data` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `_count` `object`:

**Properties:**

- `timeEntries` `number` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `pagination` `object` required:

**Properties:**

- `page` `number` required:

- `pageSize` `number` required:

- `totalCount` `number` required:

- `totalPages` `number` required:

</details>

<details>

<summary><h3 id="getprojects400">GetProjects400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getprojectsinput">GetProjectsInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="getproject">GetProject</h3></summary>

**Type:** `object`

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `_count` `object`:

**Properties:**

- `timeEntries` `number` required:

- `timeEntries` `array`:

**Array items:**

**Type:** `object`

**Properties:**

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

</details>

<details>

<summary><h3 id="getproject400">GetProject400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getprojectinput">GetProjectInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="updateproject">UpdateProject</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `object`

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- **Option 2:**

**Type:** `object`

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

</details>

<details>

<summary><h3 id="updateproject400">UpdateProject400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="updateprojectinput">UpdateProjectInput</h3></summary>

**Type:** `object`

**Properties:**

- `name` `string`:

- Minimum length: 1

- Maximum length: 255

- `description` `string`:

- `hourlyRate` `number`:

- Must be strictly greater than: 0

</details>

<details>

<summary><h3 id="createtimeentry201">CreateTimeEntry201</h3></summary>

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

</details>

<details>

<summary><h3 id="createtimeentry400">CreateTimeEntry400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="createtimeentry">CreateTimeEntry</h3></summary>

**Type:** `object`

**Properties:**

- `startedAt` `string` (format: date-time) required:

- `endedAt` `string` (format: date-time) required:

- `note` `string`:

- `projectId` `string` (format: uuid) required:

</details>

<details>

<summary><h3 id="gettimeentries">GetTimeEntries</h3></summary>

**Type:** `object`

**Properties:**

- `data` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

- `pagination` `object` required:

**Properties:**

- `page` `number` required:

- `pageSize` `number` required:

- `totalCount` `number` required:

- `totalPages` `number` required:

</details>

<details>

<summary><h3 id="gettimeentries400">GetTimeEntries400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="gettimeentriesinput">GetTimeEntriesInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="gettimeentry">GetTimeEntry</h3></summary>

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

</details>

<details>

<summary><h3 id="gettimeentry400">GetTimeEntry400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="gettimeentryinput">GetTimeEntryInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="updatetimeentry">UpdateTimeEntry</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `object`

**Properties:**

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

- **Option 2:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

</details>

<details>

<summary><h3 id="updatetimeentry400">UpdateTimeEntry400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="updatetimeentryinput">UpdateTimeEntryInput</h3></summary>

**Type:** `object`

**Properties:**

- `startedAt` `string` (format: date-time):

- `endedAt` `string` (format: date-time):

- `note` `string`:

</details>

<details>

<summary><h3 id="deletetimeentry">DeleteTimeEntry</h3></summary>

**Type:** `object`

**Properties:**

- `message` `string` required default: "Time entry deleted successfully":

</details>

<details>

<summary><h3 id="deletetimeentry400">DeleteTimeEntry400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="deletetimeentryinput">DeleteTimeEntryInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="bulkcreatetimeentries201">BulkCreateTimeEntries201</h3></summary>

**Type:** `object`

**Properties:**

- `message` `string` required:

- `entries` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

</details>

<details>

<summary><h3 id="bulkcreatetimeentries400">BulkCreateTimeEntries400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="bulkcreatetimeentries">BulkCreateTimeEntries</h3></summary>

**Type:** `object`

**Properties:**

- `entries` `array`:

**Array items:**

**Type:** `object`

**Properties:**

- `startedAt` `string` (format: date-time) required:

- `endedAt` `string` (format: date-time) required:

- `note` `string` required:

- `projectId` `string` (format: uuid) required:

- Minimum items: 1

- Maximum items: 50

</details>

<details>

<summary><h3 id="bulkdeletetimeentries">BulkDeleteTimeEntries</h3></summary>

**Type:** `object`

**Properties:**

- `message` `string` required:

- `deletedIds` `array` required:

**Array items:**

**Type:** `string`

</details>

<details>

<summary><h3 id="bulkdeletetimeentries400">BulkDeleteTimeEntries400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="bulkdeletetimeentries404">BulkDeleteTimeEntries404</h3></summary>

**Type:** `object`

**Properties:**

- `message` `string` required default: "Some time entries were not found":

- `cause` `object` required:

**Properties:**

- `code` `string` required default: "api/entries-not-found":

- `detail` `string` required:

</details>

<details>

<summary><h3 id="bulkdeletetimeentriesinput">BulkDeleteTimeEntriesInput</h3></summary>

**Type:** `object`

**Properties:**

- `ids` `array` required:

**Array items:**

**Type:** `string` (format: uuid)

- Minimum items: 1

- Maximum items: 100

</details>

<details>

<summary><h3 id="bulkupdatetimeentries">BulkUpdateTimeEntries</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `object`

**Properties:**

- `message` `string` required default: "No updates provided":

- `updatedCount` `number` required default: 0:

- **Option 2:**

**Type:** `object`

**Properties:**

- `message` `string` required:

- `updatedCount` `number` required:

</details>

<details>

<summary><h3 id="bulkupdatetimeentries400">BulkUpdateTimeEntries400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="bulkupdatetimeentries404">BulkUpdateTimeEntries404</h3></summary>

**Type:** `object`

**Properties:**

- `message` `string` required default: "Some time entries were not found":

- `cause` `object` required:

**Properties:**

- `code` `string` required default: "api/entries-not-found":

- `detail` `string` required:

</details>

<details>

<summary><h3 id="bulkupdatetimeentriesinput">BulkUpdateTimeEntriesInput</h3></summary>

**Type:** `object`

**Properties:**

- `ids` `array` required:

**Array items:**

**Type:** `string` (format: uuid)

- Minimum items: 1

- Maximum items: 100

- `updates` `object`:

**Properties:**

- `note` `string` required:

- `projectId` `string` (format: uuid):

</details>

<details>

<summary><h3 id="getsummary">GetSummary</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `object`

**Properties:**

- `groupBy` `string` required default: "client":

- `dateRange` `object` required:

**Properties:**

- `startDate` `string` required:

- `endDate` `string` required:

- `summary` `array` required:

**Array items:**

**Type:** `unknown`

- **Option 2:**

**Type:** `object`

**Properties:**

- `groupBy` `string` required default: "project":

- `dateRange` `object` required:

**Properties:**

- `startDate` `string` required:

- `endDate` `string` required:

- `summary` `array` required:

**Array items:**

**Type:** `unknown`

</details>

<details>

<summary><h3 id="getsummary400">GetSummary400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getsummaryinput">GetSummaryInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="getdetailedreport">GetDetailedReport</h3></summary>

**Type:** `object`

**Properties:**

- `data` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `durationHours` `number` required:

- `amount` `number` required:

- `project` `object` required:

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `startedAt` `string` required:

- `endedAt` `string` required:

- `note` `string` required:

- `isLocked` `boolean` required:

- `projectId` `string` required:

- `pagination` `object` required:

**Properties:**

- `page` `number` required:

- `pageSize` `number` required:

- `totalCount` `number` required:

- `totalPages` `number` required:

- `totals` `object` required:

**Properties:**

- `totalHours` `number` required:

- `totalAmount` `number` required:

- `dateRange` `object` required:

**Properties:**

- `startDate` `string` required:

- `endDate` `string` required:

</details>

<details>

<summary><h3 id="getdetailedreport400">GetDetailedReport400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getdetailedreportinput">GetDetailedReportInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="getdashboard">GetDashboard</h3></summary>

**Type:** `object`

**Properties:**

- `period` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"week"`

- **Option 2:**

**Type:** `string`

**Default:** `"month"`

- **Option 3:**

**Type:** `string`

**Default:** `"quarter"`

- **Option 4:**

**Type:** `string`

**Default:** `"year"`

- `dateRange` `object` required:

**Properties:**

- `startDate` `string` required:

- `endDate` `string` required:

- `metrics` `object` required:

**Properties:**

- `totalHours` `number` required:

- `totalAmount` `number` required:

- `totalInvoiced` `number` required:

- `totalPaid` `number` required:

- `pendingAmount` `number` required:

- `activeProjects` `number` required:

- `activeClients` `number` required:

- `timeEntriesCount` `number` required:

- `invoicesCount` `number` required:

- `invoicesByStatus` `object` required:

**Additional Properties:**

**Type:** `number`

</details>

<details>

<summary><h3 id="getdashboard400">GetDashboard400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getdashboardinput">GetDashboardInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="gettimeanalytics">GetTimeAnalytics</h3></summary>

**Type:** `object`

**Properties:**

- `groupBy` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"week"`

- **Option 2:**

**Type:** `string`

**Default:** `"month"`

- **Option 3:**

**Type:** `string`

**Default:** `"day"`

- `dateRange` `object` required:

**Properties:**

- `startDate` `string` required:

- `endDate` `string` required:

- `analytics` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `period` `unknown` required:

- `totalHours` `number` required:

- `totalAmount` `number` required:

- `entriesCount` `unknown` required:

- `projectsCount` `unknown` required:

- `clientsCount` `unknown` required:

- `averageHoursPerEntry` `number` required:

- `statistics` `object` required:

**Properties:**

- `totalPeriods` `number` required:

- `averageHoursPerPeriod` `number` required:

- `averageAmountPerPeriod` `number` required:

- `mostProductivePeriod` `unknown` required:

</details>

<details>

<summary><h3 id="gettimeanalytics400">GetTimeAnalytics400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="gettimeanalyticsinput">GetTimeAnalyticsInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="getproductivitymetrics">GetProductivityMetrics</h3></summary>

**Type:** `object`

**Properties:**

- `dateRange` `object` required:

**Properties:**

- `startDate` `string` required:

- `endDate` `string` required:

- `totalDays` `number` required:

- `productivity` `object` required:

**Properties:**

- `totalHours` `number` required:

- `totalAmount` `number` required:

- `averageHoursPerDay` `number` required:

- `averageSessionDuration` `number` required:

- `totalSessions` `number` required:

- `uniqueProjects` `number` required:

- `uniqueClients` `number` required:

- `dailyDistribution` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `day` `string` required:

- `hours` `number` required:

- `percentage` `number` required:

- `topProjects` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `name` `unknown` required:

- `client` `unknown` required:

- `hours` `number` required:

- `amount` `number` required:

- `percentage` `number` required:

- `topClients` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `name` `unknown` required:

- `hours` `number` required:

- `amount` `number` required:

- `projectsCount` `number` required:

- `percentage` `number` required:

- `peakHours` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `hour` `number` required:

- `hours` `number` required:

</details>

<details>

<summary><h3 id="getproductivitymetrics400">GetProductivityMetrics400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getproductivitymetricsinput">GetProductivityMetricsInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="exporttimeentries">ExportTimeEntries</h3></summary>

**Type:** `object`

**Additional Properties:**

- Allowed: true

</details>

<details>

<summary><h3 id="exporttimeentries400">ExportTimeEntries400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="exporttimeentriesinput">ExportTimeEntriesInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="exportinvoices">ExportInvoices</h3></summary>

**Type:** `object`

**Additional Properties:**

- Allowed: true

</details>

<details>

<summary><h3 id="exportinvoices400">ExportInvoices400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="exportinvoicesinput">ExportInvoicesInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="exportclienttimeentries">ExportClientTimeEntries</h3></summary>

**Type:** `object`

**Additional Properties:**

- Allowed: true

</details>

<details>

<summary><h3 id="exportclienttimeentries400">ExportClientTimeEntries400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="exportclienttimeentriesinput">ExportClientTimeEntriesInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="exportprojecttimeentries">ExportProjectTimeEntries</h3></summary>

**Type:** `object`

**Additional Properties:**

- Allowed: true

</details>

<details>

<summary><h3 id="exportprojecttimeentries400">ExportProjectTimeEntries400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="exportprojecttimeentries404">ExportProjectTimeEntries404</h3></summary>

**Type:** `object`

**Properties:**

- `error` `string` required default: "Project not found":

</details>

<details>

<summary><h3 id="exportprojecttimeentriesinput">ExportProjectTimeEntriesInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="exportclientprojectstimeentries">ExportClientProjectsTimeEntries</h3></summary>

**Type:** `object`

**Additional Properties:**

- Allowed: true

</details>

<details>

<summary><h3 id="exportclientprojectstimeentries400">ExportClientProjectsTimeEntries400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="exportclientprojectstimeentries404">ExportClientProjectsTimeEntries404</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `object`

**Properties:**

- `error` `string` required default: "Client not found":

- **Option 2:**

**Type:** `object`

**Properties:**

- `error` `string` required default: "Some projects not found or do not belong to this client":

- `missingProjectIds` `array` required:

**Array items:**

**Type:** `string`

</details>

<details>

<summary><h3 id="exportclientprojectstimeentriesinput">ExportClientProjectsTimeEntriesInput</h3></summary>

**Type:** `object`

**Properties:**

- `projectIds` `array` required:

**Array items:**

**Type:** `string` (format: uuid)

- Minimum items: 1

- Maximum items: 50

- `startDate` `string` (format: date-time):

- `endDate` `string` (format: date-time):

</details>

<details>

<summary><h3 id="createinvoice201">CreateInvoice201</h3></summary>

**Type:** `object`

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `invoiceLines` `array`:

**Array items:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `status` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"DRAFT"`

- **Option 2:**

**Type:** `string`

**Default:** `"SENT"`

- **Option 3:**

**Type:** `string`

**Default:** `"PAID"`

- `clientId` `string` required:

- `invoiceNumber` `string` required:

- `dateFrom` `string` required:

- `dateTo` `string` required:

- `sentAt` `string` required:

- `paidAt` `string` required:

- `paidAmount` `string` required:

- `pdfUrl` `string` required:

- `notes` `string` required:

</details>

<details>

<summary><h3 id="createinvoice400">CreateInvoice400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="createinvoice">CreateInvoice</h3></summary>

**Type:** `object`

**Properties:**

- `clientId` `string` (format: uuid) required:

- `dateFrom` `string` (format: date-time) required:

- `dateTo` `string` (format: date-time) required:

</details>

<details>

<summary><h3 id="getinvoices">GetInvoices</h3></summary>

**Type:** `object`

**Properties:**

- `data` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `totalAmount` `number` required:

- `client` `object` required:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `invoiceLines` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `status` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"DRAFT"`

- **Option 2:**

**Type:** `string`

**Default:** `"SENT"`

- **Option 3:**

**Type:** `string`

**Default:** `"PAID"`

- `clientId` `string` required:

- `invoiceNumber` `string` required:

- `dateFrom` `string` required:

- `dateTo` `string` required:

- `sentAt` `string` required:

- `paidAt` `string` required:

- `paidAmount` `string` required:

- `pdfUrl` `string` required:

- `notes` `string` required:

- `pagination` `object` required:

**Properties:**

- `page` `number` required:

- `pageSize` `number` required:

- `totalCount` `number` required:

- `totalPages` `number` required:

</details>

<details>

<summary><h3 id="getinvoices400">GetInvoices400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getinvoicesinput">GetInvoicesInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="getinvoice">GetInvoice</h3></summary>

**Type:** `object`

**Properties:**

- `totalAmount` `number` required:

- `client` `object` required:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `invoiceLines` `array` required:

**Array items:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `status` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"DRAFT"`

- **Option 2:**

**Type:** `string`

**Default:** `"SENT"`

- **Option 3:**

**Type:** `string`

**Default:** `"PAID"`

- `clientId` `string` required:

- `invoiceNumber` `string` required:

- `dateFrom` `string` required:

- `dateTo` `string` required:

- `sentAt` `string` required:

- `paidAt` `string` required:

- `paidAmount` `string` required:

- `pdfUrl` `string` required:

- `notes` `string` required:

</details>

<details>

<summary><h3 id="getinvoice400">GetInvoice400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="getinvoiceinput">GetInvoiceInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="deleteinvoice">DeleteInvoice</h3></summary>

**Type:** `object`

**Properties:**

- `message` `string` required default: "Invoice deleted successfully":

</details>

<details>

<summary><h3 id="deleteinvoice400">DeleteInvoice400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="deleteinvoiceinput">DeleteInvoiceInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="updateinvoice">UpdateInvoice</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `object`

**Properties:**

- `invoiceLines` `array`:

**Array items:**

**Type:** `object`

**Properties:**

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `status` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"DRAFT"`

- **Option 2:**

**Type:** `string`

**Default:** `"SENT"`

- **Option 3:**

**Type:** `string`

**Default:** `"PAID"`

- `clientId` `string` required:

- `invoiceNumber` `string` required:

- `dateFrom` `string` required:

- `dateTo` `string` required:

- `sentAt` `string` required:

- `paidAt` `string` required:

- `paidAmount` `string` required:

- `pdfUrl` `string` required:

- `notes` `string` required:

- **Option 2:**

**Type:** `object`

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `invoiceLines` `array`:

**Array items:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `status` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"DRAFT"`

- **Option 2:**

**Type:** `string`

**Default:** `"SENT"`

- **Option 3:**

**Type:** `string`

**Default:** `"PAID"`

- `clientId` `string` required:

- `invoiceNumber` `string` required:

- `dateFrom` `string` required:

- `dateTo` `string` required:

- `sentAt` `string` required:

- `paidAt` `string` required:

- `paidAmount` `string` required:

- `pdfUrl` `string` required:

- `notes` `string` required:

</details>

<details>

<summary><h3 id="updateinvoice400">UpdateInvoice400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="updateinvoiceinput">UpdateInvoiceInput</h3></summary>

**Type:** `object`

**Properties:**

- `dateFrom` `string` (format: date-time):

- `dateTo` `string` (format: date-time):

</details>

<details>

<summary><h3 id="updateinvoicestatus">UpdateInvoiceStatus</h3></summary>

**Type:** `object`

**Properties:**

- `client` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `email` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `invoiceLines` `array`:

**Array items:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

- `id` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `status` **Any of (Union):** required:

- **Option 1:**

**Type:** `string`

**Default:** `"DRAFT"`

- **Option 2:**

**Type:** `string`

**Default:** `"SENT"`

- **Option 3:**

**Type:** `string`

**Default:** `"PAID"`

- `clientId` `string` required:

- `invoiceNumber` `string` required:

- `dateFrom` `string` required:

- `dateTo` `string` required:

- `sentAt` `string` required:

- `paidAt` `string` required:

- `paidAmount` `string` required:

- `pdfUrl` `string` required:

- `notes` `string` required:

</details>

<details>

<summary><h3 id="updateinvoicestatus400">UpdateInvoiceStatus400</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `unknown`

- **Option 2:**

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="updateinvoicestatusinput">UpdateInvoiceStatusInput</h3></summary>

**Type:** `object`

**Properties:**

- `status` `string` (enum) required:

**Allowed values:**

- `"SENT"`

- `"PAID"`

- `paidAmount` `number`:

- Must be strictly greater than: 0

</details>

<details>

<summary><h3 id="generateinvoicepdf">GenerateInvoicePdf</h3></summary>

**Type:** `object`

**Properties:**

- `pdfUrl` `string` required:

- `message` `string` required default: "PDF generation initiated":

</details>

<details>

<summary><h3 id="generateinvoicepdf400">GenerateInvoicePdf400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="generateinvoicepdfinput">GenerateInvoicePdfInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="updateinvoiceline">UpdateInvoiceLine</h3></summary>

**One of (Exclusive Union):**

- **Option 1:**

**Type:** `object`

**Properties:**

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

- **Option 2:**

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

</details>

<details>

<summary><h3 id="updateinvoiceline400">UpdateInvoiceLine400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="updateinvoicelineinput">UpdateInvoiceLineInput</h3></summary>

**Type:** `object`

**Properties:**

- `description` `string`:

- Minimum length: 1

- Maximum length: 255

- `hours` `number`:

- Must be strictly greater than: 0

- `rate` `number`:

- Must be strictly greater than: 0

</details>

<details>

<summary><h3 id="deleteinvoiceline">DeleteInvoiceLine</h3></summary>

**Type:** `object`

**Properties:**

- `message` `string` required default: "Invoice line deleted successfully":

</details>

<details>

<summary><h3 id="deleteinvoiceline400">DeleteInvoiceLine400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="deleteinvoicelineinput">DeleteInvoiceLineInput</h3></summary>

**Type:** `unknown`

</details>

<details>

<summary><h3 id="addinvoiceline201">AddInvoiceLine201</h3></summary>

**Type:** `object`

**Properties:**

- `project` `object`:

**Properties:**

- `id` `string` required:

- `name` `string` required:

- `createdAt` `string` required:

- `updatedAt` `string` required:

- `userId` `string` required:

- `description` `string` required:

- `hourlyRate` `string` required:

- `clientId` `string` required:

- `id` `string` required:

- `description` `string` required:

- `projectId` `string` required:

- `hours` `string` required:

- `rate` `string` required:

- `amount` `string` required:

- `invoiceId` `string` required:

</details>

<details>

<summary><h3 id="addinvoiceline400">AddInvoiceLine400</h3></summary>

**Type:** [`ValidationError`](#validationerror)

</details>

<details>

<summary><h3 id="addinvoiceline">AddInvoiceLine</h3></summary>

**Type:** `object`

**Properties:**

- `description` `string` required:

- Minimum length: 1

- Maximum length: 255

- `hours` `number` required:

- Must be strictly greater than: 0

- `rate` `number` required:

- Must be strictly greater than: 0

- `projectId` `string` (format: uuid) required:

</details>
