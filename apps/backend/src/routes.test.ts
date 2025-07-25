import assert from 'node:assert';
import { describe, it } from 'node:test';

import app from '../src/app.ts';

describe('Time Tracking API - Unauthenticated Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await app.request('/api/health');
      assert.strictEqual(res.status, 200);

      const data = (await res.json()) as { status: string; timestamp: string };
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp);
    });
  });

  describe('Authentication Required', () => {
    it('should require authentication for clients endpoint', async () => {
      const res = await app.request('/api/clients');
      assert.strictEqual(res.status, 401);

      const data = (await res.json()) as { error: string; cause: any };
      assert.strictEqual(data.error, 'Authentication required');
      assert.strictEqual(data.cause.code, 'api/unauthenticated');
    });

    it('should require authentication for projects endpoint', async () => {
      const res = await app.request('/api/projects');
      assert.strictEqual(res.status, 401);

      const data = (await res.json()) as { error: string; cause: any };
      assert.strictEqual(data.error, 'Authentication required');
    });

    it('should require authentication for time entries endpoint', async () => {
      const res = await app.request('/api/time-entries');
      assert.strictEqual(res.status, 401);

      const data = (await res.json()) as { error: string; cause: any };
      assert.strictEqual(data.error, 'Authentication required');
    });

    it('should require authentication for invoices endpoint', async () => {
      const res = await app.request('/api/invoices');
      assert.strictEqual(res.status, 401);

      const data = (await res.json()) as { error: string; cause: any };
      assert.strictEqual(data.error, 'Authentication required');
    });

    it('should require authentication for reports endpoint', async () => {
      const res = await app.request('/api/reports/summary?groupBy=client');
      assert.strictEqual(res.status, 401);

      const data = (await res.json()) as { error: string; cause: any };
      assert.strictEqual(data.error, 'Authentication required');
    });
  });

  describe('Input Validation', () => {
    it('should validate POST request to clients with missing data', async () => {
      const res = await app.request('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Should get 401 for missing auth first, but this verifies the endpoint exists
      assert.strictEqual(res.status, 401);
    });

    it('should validate POST request to projects with missing data', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Should get 401 for missing auth first, but this verifies the endpoint exists
      assert.strictEqual(res.status, 401);
    });

    it('should validate POST request to time entries with missing data', async () => {
      const res = await app.request('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Should get 401 for missing auth first, but this verifies the endpoint exists
      assert.strictEqual(res.status, 401);
    });
  });

  describe('Route Existence', () => {
    it('should handle 404 for non-existent routes', async () => {
      const res = await app.request('/api/non-existent');
      assert.strictEqual(res.status, 404);

      const data = (await res.json()) as { error: string; cause: any };
      assert.strictEqual(data.error, 'Not Found');
      assert.strictEqual(data.cause.code, 'api/not-found');
    });

    it('should have all required API endpoints registered', async () => {
      // Test that our main endpoints exist (they'll return 401 but that means they're registered)
      const endpoints = [
        '/api/clients',
        '/api/projects',
        '/api/time-entries',
        '/api/invoices',
        '/api/reports/summary',
      ];

      for (const endpoint of endpoints) {
        const res = await app.request(endpoint);
        // Should be 401 (auth required) not 404 (not found)
        assert.strictEqual(
          res.status,
          401,
          `Endpoint ${endpoint} should exist and require auth`,
        );
      }
    });
  });
});
