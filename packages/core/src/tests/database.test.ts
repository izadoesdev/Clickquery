import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { DatabaseManager } from '../schema/database';
import { defineModel } from '../schema/defineModel';
import { Str, Int8, DateTime, ClickHouseEngine } from '../schema/types';
import { setupTestDatabase, teardownTestDatabase } from './setup';

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase(dbManager);
  });

  describe('URL Handling', () => {
    test('should extract database name from path format URL', () => {
      const manager = new DatabaseManager({
        url: 'http://default:analytics@localhost:8123/analytics'
      });
      // Use the public getter method
      expect(manager.getDatabase()).toBe('my_database');
    });

    test('should extract database name from query parameter', () => {
      const manager = new DatabaseManager({
        url: 'http://default:analytics@localhost:8123/analytics'
      });
      // Use the public getter method
      expect(manager.getDatabase()).toBe('query_database');
    });

    test('should use default database name when not specified', () => {
      const manager = new DatabaseManager({
        url: 'http://default:analytics@localhost:8123'
      });
      // Use the public getter method
      expect(manager.getDatabase()).toBe('analytics');
    });
  });

  describe('Table Operations', () => {
    test('should check if table exists', async () => {
      // First make sure the table doesn't exist
      await dbManager.dropTable('test_table_exists');
      
      let exists = await dbManager.tableExists('test_table_exists');
      expect(exists).toBe(false);
      
      // Create a simple model and table
      const TestModel = defineModel({
        name: 'test_table_exists',
        columns: {
          id: Str(),
          value: Int8()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      await dbManager.createTable(TestModel);
      
      exists = await dbManager.tableExists('test_table_exists');
      expect(exists).toBe(true);
    });
    
    test('should create and drop tables', async () => {
      const TestModel = defineModel({
        name: 'test_create_drop',
        columns: {
          id: Str(),
          created_at: DateTime()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      // Create the table
      await dbManager.createTable(TestModel);
      const exists = await dbManager.tableExists('test_create_drop');
      expect(exists).toBe(true);
      
      // Drop the table
      await dbManager.dropTable('test_create_drop');
      const existsAfterDrop = await dbManager.tableExists('test_create_drop');
      expect(existsAfterDrop).toBe(false);
    });
  });

  describe('Column Operations', () => {
    test('should get columns for a table', async () => {
      // Create a test table
      const TestModel = defineModel({
        name: 'test_columns',
        columns: {
          id: Str(),
          name: Str(),
          age: Int8()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      await dbManager.createTable(TestModel);
      
      // Get columns
      const columns = await dbManager.getColumns('test_columns');
      expect(columns.has('id')).toBe(true);
      expect(columns.has('name')).toBe(true);
      expect(columns.has('age')).toBe(true);
      expect(columns.has('non_existent')).toBe(false);
      
      // Clean up
      await dbManager.dropTable('test_columns');
    });
    
    test('should sync columns when table schema changes', async () => {
      // Create initial model
      const InitialModel = defineModel({
        name: 'test_sync',
        columns: {
          id: Str(),
          name: Str()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      await dbManager.createTable(InitialModel);
      
      // Updated model with new columns
      const UpdatedModel = defineModel({
        name: 'test_sync',
        columns: {
          id: Str(),
          name: Str(),
          email: Str(),
          age: Int8()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      // Sync columns
      await dbManager.syncColumns(UpdatedModel);
      
      // Check if new columns were added
      const columns = await dbManager.getColumns('test_sync');
      expect(columns.has('id')).toBe(true);
      expect(columns.has('name')).toBe(true);
      expect(columns.has('email')).toBe(true);
      expect(columns.has('age')).toBe(true);
      
      // Clean up
      await dbManager.dropTable('test_sync');
    });
  });

  describe('Table Ensuring', () => {
    test('should create table if it does not exist', async () => {
      const TestModel = defineModel({
        name: 'test_ensure_new',
        columns: {
          id: Str(),
          value: Int8()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      // Make sure the table doesn't exist
      await dbManager.dropTable('test_ensure_new');
      
      // Ensure table
      await dbManager.ensureTable(TestModel);
      
      const exists = await dbManager.tableExists('test_ensure_new');
      expect(exists).toBe(true);
      
      // Clean up
      await dbManager.dropTable('test_ensure_new');
    });
    
    test('should update columns if table exists', async () => {
      // Create initial model
      const InitialModel = defineModel({
        name: 'test_ensure_existing',
        columns: {
          id: Str(),
          name: Str()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      await dbManager.createTable(InitialModel);
      
      // Updated model with new column
      const UpdatedModel = defineModel({
        name: 'test_ensure_existing',
        columns: {
          id: Str(),
          name: Str(),
          description: Str()
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });
      
      // Ensure table
      await dbManager.ensureTable(UpdatedModel);
      
      // Check if new column was added
      const columns = await dbManager.getColumns('test_ensure_existing');
      expect(columns.has('description')).toBe(true);
      
      // Clean up
      await dbManager.dropTable('test_ensure_existing');
    });
  });
}); 