import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { MigrationManager } from '../schema/migration';
import { defineModel } from '../schema/defineModel';
import { Str, Bool, DateTime, ArrayType, JSONType, Int8, ClickHouseEngine } from '../schema/types';
import { createTable, alterTable } from '../schema/migration';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import type { DatabaseManager } from '../schema/database';
import type { ClickQueryClient } from '../client';

// Tests that don't require a database connection
describe('Schema Migration Utilities', () => {
  describe('Create Table', () => {
    test('should generate correct CREATE TABLE statement', () => {
      const User = defineModel({
        name: 'users',
        columns: {
          id: Str({ primaryKey: true }),
          username: Str({ unique: true }),
          email: Str({ nullable: true }),
          role: Int8({ default: 1 }),
          is_active: Bool({ default: true }),
          created_at: DateTime({ default: 'now()' })
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });

      const sql = createTable(User);
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
      expect(sql).toContain('id String NOT NULL');
      expect(sql).toContain('username String NOT NULL');
      expect(sql).toContain('email String NULL');
      expect(sql).toContain('role Int8 NOT NULL DEFAULT 1');
      expect(sql).toContain('is_active Boolean NOT NULL DEFAULT true');
      expect(sql).toContain('created_at DateTime NOT NULL DEFAULT now()');
      expect(sql).toContain('ENGINE = MergeTree');
      expect(sql).toContain('ORDER BY (id)');
    });

    test('should handle complex types and partitioning', () => {
      const Event = defineModel({
        name: 'events',
        columns: {
          id: Str({ primaryKey: true }),
          user_id: Str({ index: true }),
          event_type: Str(),
          properties: JSONType(),
          tags: ArrayType(Str()),
          created_at: DateTime({ default: 'now()' })
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['created_at', 'id'],
        partitionBy: 'toYYYYMM(created_at)'
      });

      const sql = createTable(Event);
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS events');
      expect(sql).toContain('properties JSON NOT NULL');
      expect(sql).toContain('tags Array(String) NOT NULL');
      expect(sql).toContain('ORDER BY (created_at, id)');
      expect(sql).toContain('PARTITION BY toYYYYMM(created_at)');
    });
  });

  describe('Alter Table', () => {
    test('should generate correct ALTER TABLE statements', () => {
      const User = defineModel({
        name: 'users',
        columns: {
          id: Str({ primaryKey: true }),
          username: Str({ unique: true }),
          email: Str({ nullable: true }),
          role: Int8({ default: 1 }),
          is_active: Bool({ default: true }),
          created_at: DateTime({ default: 'now()' })
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });

      const existingColumns = new Set(['id', 'username']);
      const alterStatements = alterTable(User, existingColumns);

      expect(alterStatements).toHaveLength(1);
      expect(alterStatements[0]).toContain('ALTER TABLE users');
      expect(alterStatements[0]).toContain('ADD COLUMN email String NULL');
      expect(alterStatements[0]).toContain('ADD COLUMN role Int8 NOT NULL DEFAULT 1');
      expect(alterStatements[0]).toContain('ADD COLUMN is_active Boolean NOT NULL DEFAULT true');
      expect(alterStatements[0]).toContain('ADD COLUMN created_at DateTime NOT NULL DEFAULT now()');
    });

    test('should not generate ALTER TABLE statements when no new columns', () => {
      const User = defineModel({
        name: 'users',
        columns: {
          id: Str({ primaryKey: true }),
          username: Str({ unique: true })
        },
        engine: ClickHouseEngine.MergeTree,
        orderBy: ['id']
      });

      const existingColumns = new Set(['id', 'username']);
      const alterStatements = alterTable(User, existingColumns);

      expect(alterStatements).toHaveLength(0);
    });
  });
});

// Tests that require a database connection
describe.skip('Migration System Integration', () => {
  let migrationManager: MigrationManager;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = await setupTestDatabase();
    migrationManager = new MigrationManager({ 
      url: 'http://default:analytics@localhost:8123/analytics' 
    });
    await migrationManager.initialize();
  });

  afterAll(async () => {
    await teardownTestDatabase(dbManager);
  });

  test('should track applied migrations', async () => {
    const User = defineModel({
      name: 'users',
      columns: {
        id: Str({ primaryKey: true }),
        name: Str(),
        age: Int8(),
        created_at: DateTime({ default: 'now()' })
      },
      engine: ClickHouseEngine.MergeTree,
      orderBy: ['id']
    });

    const migration = {
      version: 1,
      name: 'create_users_table',
      up: async (client: ClickQueryClient) => {
        await dbManager.ensureTable(User);
      },
      down: async (client: ClickQueryClient) => {
        await dbManager.dropTable('users');
      }
    };

    await migrationManager.applyMigrations([migration]);
    const applied = await migrationManager.getAppliedMigrations();
    expect(applied).toContain(1);

    // Verify table was created
    const result = await dbManager.client.query(`
      SELECT name FROM system.tables WHERE database = 'analytics' AND name = 'users'
    `);
    expect(result.data.length).toBe(1);
  });

  test('should handle rollback', async () => {
    const Event = defineModel({
      name: 'events',
      columns: {
        id: Str({ primaryKey: true }),
        type: Str(),
        created_at: DateTime({ default: 'now()' })
      },
      engine: ClickHouseEngine.MergeTree,
      orderBy: ['id']
    });

    const migration = {
      version: 2,
      name: 'create_events_table',
      up: async (client: ClickQueryClient) => {
        await dbManager.ensureTable(Event);
      },
      down: async (client: ClickQueryClient) => {
        await dbManager.dropTable('events');
      }
    };

    await migrationManager.applyMigrations([migration]);
    await migrationManager.rollbackMigrations();

    const applied = await migrationManager.getAppliedMigrations();
    expect(applied).not.toContain(2);

    // Verify table was dropped
    const result = await dbManager.client.query(`
      SELECT name FROM system.tables WHERE database = 'analytics' AND name = 'events'
    `);
    expect(result.data.length).toBe(0);
  });

  test('should handle schema changes', async () => {
    const User = defineModel({
      name: 'users',
      columns: {
        id: Str({ primaryKey: true }),
        name: Str(),
        email: Str({ nullable: true }),
        created_at: DateTime({ default: 'now()' })
      },
      engine: ClickHouseEngine.MergeTree,
      orderBy: ['id']
    });

    const migration = {
      version: 3,
      name: 'add_email_to_users',
      up: async (client: ClickQueryClient) => {
        await dbManager.ensureTable(User);
      },
      down: async (client: ClickQueryClient) => {
        await dbManager.client.query('ALTER TABLE users DROP COLUMN email');
      }
    };

    await migrationManager.applyMigrations([migration]);

    // Verify column was added
    const result = await dbManager.client.query(`
      SELECT name FROM system.columns 
      WHERE database = 'analytics' 
      AND table = 'users' 
      AND name = 'email'
    `);
    expect(result.data.length).toBe(1);
  });
}); 