import type { Model } from './defineModel';
import type { Column } from './types/base';
import type { OrderBy, PartitionBy, OrderByColumn } from './types/ordering';
// import { ClickHouseEngine } from './types';
import type { ClickQueryClient } from '../client';
import { createClient } from '../client';
import type { ClickHouseConfig } from '../types/client';

export function formatColumn(column: Column): string {
  console.log(`Formatting column with type: ${column.type}`);
  const parts: string[] = [column.type];
  
  if (column.options.nullable) {
    parts.push('NULL');
  } else {
    parts.push('NOT NULL');
  }

  if (column.options.default !== undefined) {
    parts.push(`DEFAULT ${column.options.default}`);
  }

  const formatted = parts.join(' ');
  console.log(`Formatted column: ${formatted}`);
  return formatted;
}

export function formatOrderBy(orderBy: OrderBy): string {
  console.log('Formatting ORDER BY clause');
  const columns = Array.isArray(orderBy) 
    ? orderBy.map((col: string | OrderByColumn) => 
        typeof col === 'string' ? col : `${col.column} ${col.direction}`)
    : (orderBy as OrderByColumn[]).map(col => `${col.column} ${col.direction}`);
  const formatted = `ORDER BY (${columns.join(', ')})`;
  console.log(`Formatted ORDER BY: ${formatted}`);
  return formatted;
}

export function formatPartitionBy(partitionBy: PartitionBy, columns: Record<string, Column>): string {
  console.log('Formatting PARTITION BY clause');
  const partitionExpr = typeof partitionBy === 'function' 
    ? partitionBy(columns)
    : partitionBy;
  const formatted = `PARTITION BY ${partitionExpr}`;
  console.log(`Formatted PARTITION BY: ${formatted}`);
  return formatted;
}

export function createTable(model: Model): string {
  console.log(`Creating table definition for: ${model.name}`);
  const columns = Object.entries(model.columns)
    .map(([name, column]) => `${name} ${formatColumn(column)}`)
    .join(',\n  ');

  const parts = [
    `CREATE TABLE IF NOT EXISTS ${model.name} (\n  ${columns}\n)`,
    `ENGINE = ${model.engine}`
  ];

  if (model.orderBy) {
    parts.push(formatOrderBy(model.orderBy));
  }

  if (model.partitionBy) {
    parts.push(formatPartitionBy(model.partitionBy, model.columns));
  }

  const createStatement = parts.join('\n');
  console.log(`Generated CREATE TABLE statement:\n${createStatement}`);
  return createStatement;
}

export function alterTable(model: Model, existingColumns: Set<string>): string[] {
  console.log(`Generating ALTER TABLE statements for: ${model.name}`);
  const alterStatements: string[] = [];
  const newColumns = Object.entries(model.columns)
    .filter(([name]) => !existingColumns.has(name))
    .map(([name, column]) => `ADD COLUMN ${name} ${formatColumn(column)}`);

  if (newColumns.length > 0) {
    const alterStatement = `ALTER TABLE ${model.name} ${newColumns.join(', ')}`;
    console.log(`Generated ALTER TABLE statement: ${alterStatement}`);
    alterStatements.push(alterStatement);
  } else {
    console.log('No new columns to add');
  }

  return alterStatements;
}

export async function getExistingColumns(client: ClickQueryClient, tableName: string): Promise<Set<string>> {
  console.log(`Fetching existing columns for table: ${tableName}`);
  const result = await client.query<{ name: string }>(`
    SELECT name 
    FROM system.columns 
    WHERE table = '${tableName}'
  `);
  
  const columns = new Set(result.data.map(row => row.name));
  console.log(`Found ${columns.size} existing columns: ${Array.from(columns).join(', ')}`);
  return columns;
}

export interface Migration {
  version: number;
  name: string;
  up: (client: ReturnType<typeof createClient>) => Promise<void>;
  down: (client: ReturnType<typeof createClient>) => Promise<void>;
}

export class MigrationManager {
  private client: ReturnType<typeof createClient>;
  private migrations: Migration[] = [];

  constructor(config: ClickHouseConfig) {
    this.client = createClient(config);
  }

  async initialize() {
    // Create migrations table if it doesn't exist
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version UInt64,
        name String,
        applied_at DateTime DEFAULT now(),
        PRIMARY KEY (version)
      ) ENGINE = MergeTree()
      ORDER BY (version)
    `);
  }

  async getAppliedMigrations(): Promise<number[]> {
    const result = await this.client.query<{ version: number }>(`
      SELECT version FROM migrations ORDER BY version
    `);
    return result.data.map(m => m.version);
  }

  async applyMigrations(migrations: Migration[]) {
    const applied = await this.getAppliedMigrations();
    const toApply = migrations.filter(m => !applied.includes(m.version));

    for (const migration of toApply) {
      try {
        await migration.up(this.client);
        await this.client.query(`
          INSERT INTO migrations (version, name) VALUES (${migration.version}, '${migration.name}')
        `);
      } catch (error) {
        console.error(`Failed to apply migration ${migration.name}:`, error);
        throw error;
      }
    }
  }

  async rollbackMigrations(count = 1) {
    const applied = await this.getAppliedMigrations();
    const toRollback = applied.slice(-count);

    for (const version of toRollback) {
      const migration = this.migrations.find(m => m.version === version);
      if (!migration) {
        throw new Error(`Migration version ${version} not found`);
      }

      try {
        await migration.down(this.client);
        await this.client.query(`
          ALTER TABLE migrations DELETE WHERE version = ${version}
        `);
      } catch (error) {
        console.error(`Failed to rollback migration ${migration.name}:`, error);
        throw error;
      }
    }
  }

  async createTable(model: Model) {
    const columns = Object.entries(model.columns)
      .map(([name, column]) => {
        const options = column.options || {};
        const nullable = options.nullable ? 'NULL' : 'NOT NULL';
        const defaultVal = options.default ? `DEFAULT ${options.default}` : '';
        return `${name} ${column.type} ${nullable} ${defaultVal}`;
      })
      .join(',\n  ');

    const orderBy = model.orderBy ? `ORDER BY (${model.orderBy.join(', ')})` : '';
    const partitionBy = model.partitionBy ? `PARTITION BY ${model.partitionBy}` : '';

    await this.client.query(`
      CREATE TABLE IF NOT EXISTS ${model.name} (
        ${columns}
      ) ENGINE = ${model.engine}
      ${orderBy}
      ${partitionBy}
    `);
  }

  async alterTable(model: Model, existingColumns: Set<string>) {
    const newColumns = Object.entries(model.columns)
      .filter(([name]) => !existingColumns.has(name))
      .map(([name, column]) => {
        const options = column.options || {};
        const nullable = options.nullable ? 'NULL' : 'NOT NULL';
        const defaultVal = options.default ? `DEFAULT ${options.default}` : '';
        return `ADD COLUMN ${name} ${column.type} ${nullable} ${defaultVal}`;
      });

    if (newColumns.length > 0) {
      await this.client.query(`
        ALTER TABLE ${model.name}
        ${newColumns.join(',\n')}
      `);
    }
  }

  async getExistingColumns(table: string): Promise<Set<string>> {
    const result = await this.client.query<{ name: string }>(`
      SELECT name FROM system.columns WHERE table = '${table}'
    `);
    return new Set(result.data.map(c => c.name));
  }
}