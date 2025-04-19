import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createClient } from '../client';
import type { ClickQueryClient } from '../client';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import type { DatabaseManager } from '../schema/database';

describe('ClickHouse Client', () => {
  let client: ClickQueryClient;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = await setupTestDatabase();
    client = dbManager.client;
  });

  afterAll(async () => {
    await teardownTestDatabase(dbManager);
  });

  describe('Query Builder', () => {
    test('should build and execute a simple query', async () => {
      const result = await client.query('SELECT 1 as value');
      expect(result).toBeDefined();
      expect(result.rows).toBeGreaterThanOrEqual(0);
    });

    test('should handle complex queries', async () => {
      const result = await client.query(`
        SELECT 
          1 as value,
          'test' as name,
          now() as timestamp
      `);
      expect(result).toBeDefined();
      expect(result.rows).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid queries gracefully', async () => {
      let errorThrown = false;
      try {
        await client.query('INVALID SQL QUERY');
      } catch (error: unknown) {
        errorThrown = true;
        expect(error).toBeDefined();
        if (error instanceof Error) {
          // Just check that we get some kind of error message
          expect(error.message.length).toBeGreaterThan(0);
        }
      }
      expect(errorThrown).toBe(true);
    });

    test('should handle connection errors', async () => {
      const invalidClient = createClient({
        url: 'http://invalid-host:8123'
      });

      try {
        await invalidClient.query('SELECT 1');
      } catch (error: unknown) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toBeDefined();
        }
      }
    });
  });
}); 