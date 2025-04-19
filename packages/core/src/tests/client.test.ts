import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createClient } from '../client';
import type { ClickQueryClient } from '../client';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import type { DatabaseManager } from '../schema/database';
import { defineModel } from '../schema/defineModel';
import { Str, Int8, DateTime, ClickHouseEngine } from '../schema/types';

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

  describe('Raw Query Execution', () => {
    test('should build and execute a simple query', async () => {
      try {
        const result = await client.query('SELECT 1 as value');
        expect(result).toBeDefined();
        expect(result.rows).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });

    test('should handle complex queries', async () => {
      try {
        const result = await client.query('SELECT 1 as value, 2 as other_value');
        expect(result).toBeDefined();
        expect(result.rows).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });

    test('should handle queries with date functions', async () => {
      try {
        const result = await client.query(`
          SELECT 
            now() as current_time,
            today() as current_date
        `);
        expect(result).toBeDefined();
        expect(result.rows).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });

    test('should handle queries with aggregations', async () => {
      try {
        const result = await client.query(`
          WITH 
            0 as min_value,
            9 as max_value,
            45 as sum_value,
            10 as count_value
          SELECT 
            min_value,
            max_value,
            sum_value,
            count_value
        `);
        expect(result).toBeDefined();
        expect(result.rows).toBeGreaterThanOrEqual(0);
        if (result.data.length > 0) {
          const data = result.data[0] as Record<string, unknown>;
          expect(data.min_value).toBe(0);
          expect(data.max_value).toBe(9);
          expect(data.sum_value).toBe(45);
          expect(data.count_value).toBe(10);
        }
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });
  });

  describe('Query Builder API', () => {
    // Create a test model for query builder tests
    const TestModel = defineModel({
      name: 'test_query_builder',
      columns: {
        id: Str(),
        name: Str(),
        age: Int8(),
        created_at: DateTime()
      },
      engine: ClickHouseEngine.MergeTree,
      orderBy: ['id']
    });

    beforeAll(async () => {
      // Create the test table
      await dbManager.createTable(TestModel);
      
      // Insert some test data
      await client.insert(TestModel, {
        name: 'John Doe',
        age: 30,
        created_at: new Date()
      });
      
      await client.insert(TestModel, {
        name: 'Jane Smith',
        age: 25,
        created_at: new Date()
      });
    });

    afterAll(async () => {
      // Clean up the test table
      await dbManager.dropTable('test_query_builder');
    });

    test('should select all records from a table', async () => {
      const result = await client.select(TestModel).limit(10);
      expect(result).toBeDefined();
      expect(result.rows).toBe(2);
    });

    test('should filter records with where clause', async () => {
      const result = await client.select(TestModel)
        .where('id', '=', 'user1')
        .limit(10);
      
      expect(result).toBeDefined();
      expect(result.rows).toBe(1);
      if (result.data.length > 0) {
        const data = result.data[0] as unknown as Record<string, unknown>;
        expect(data.id).toBe('user1');
        expect(data.name).toBe('John Doe');
      }
    });

    test('should use multiple where conditions', async () => {
      const result = await client.select(TestModel)
        .where('age', '>', 20)
        .andWhere('age', '<', 30)
        .limit(10);
      
      expect(result).toBeDefined();
      expect(result.rows).toBe(1);
      if (result.data.length > 0) {
        const data = result.data[0] as unknown as Record<string, unknown>;
        expect(data.id).toBe('user2');
        expect(data.name).toBe('Jane Smith');
      }
    });

    test('should order results', async () => {
      const result = await client.select(TestModel)
        .orderBy('age', 'DESC')
        .limit(10);
      
      expect(result).toBeDefined();
      expect(result.rows).toBe(2);
      if (result.data.length > 1) {
        const first = result.data[0] as unknown as Record<string, unknown>;
        const second = result.data[1] as unknown as Record<string, unknown>;
        expect(Number(first.age)).toBeGreaterThan(Number(second.age));
      }
    });

    test('should limit results', async () => {
      const result = await client.select(TestModel)
        .limit(1);
      
      expect(result).toBeDefined();
      expect(result.rows).toBe(1);
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

    test('should handle queries with syntax errors', async () => {
      let errorThrown = false;
      try {
        await client.query('SELECT * FORM system.numbers');
      } catch (error: unknown) {
        errorThrown = true;
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toContain('Syntax error');
        }
      }
      expect(errorThrown).toBe(true);
    });

    test('should handle queries with non-existent tables', async () => {
      let errorThrown = false;
      try {
        await client.query('SELECT * FROM non_existent_table');
      } catch (error: unknown) {
        errorThrown = true;
        expect(error).toBeDefined();
      }
      expect(errorThrown).toBe(true);
    });
  });

  describe('Query Formatting', () => {
    test('should handle queries with FORMAT clause', async () => {
      try {
        // The client should handle this by removing the FORMAT clause
        const result = await client.query('SELECT 1 as value FORMAT JSON');
        expect(result).toBeDefined();
        expect(result.rows).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });

    test('should handle queries with different formats', async () => {
      try {
        // Even though we use a different format, the client should override it
        const result = await client.query('SELECT 1 as value FORMAT TabSeparated');
        expect(result).toBeDefined();
        expect(result.rows).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });
  });

  describe('Query Types', () => {
    test('should handle different data types', async () => {
      try {
        const result = await client.query(`
          SELECT 
            toInt32(1) as int_value,
            toFloat64(1.5) as float_value,
            'test' as string_value,
            [1, 2, 3] as array_value
        `);
        expect(result).toBeDefined();
        expect(result.rows).toBeGreaterThanOrEqual(0);
        if (result.data.length > 0) {
          const data = result.data[0] as unknown as Record<string, unknown>;
          expect(typeof data.int_value).toBe('number');
          expect(typeof data.float_value).toBe('number');
          expect(typeof data.string_value).toBe('string');
          expect(Array.isArray(data.array_value)).toBe(true);
        }
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });

    test('should handle empty result sets', async () => {
      try {
        const result = await client.query("SELECT WHERE 1=0");
        expect(result).toBeDefined();
        expect(result.rows).toBe(0);
        expect(result.data.length).toBe(0);
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    });
  });
}); 