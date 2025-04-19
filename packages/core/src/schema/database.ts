import { createClient } from '../client';
import type { ClickQueryClient } from '../client';
import type { ClickHouseConfig } from '../types/client';
import type { Model } from './defineModel';

export class DatabaseManager {
  public client: ClickQueryClient;
  private database: string;

  constructor(config: ClickHouseConfig) {
    this.database = this.extractDatabaseName(config.url);
    this.client = createClient(config);
  }

  private extractDatabaseName(url: string): string {
    // Try to extract database name from path
    const pathMatch = url.match(/\/([^/?]+)(?:\?|$)/);
    if (pathMatch?.[1]) {
      return pathMatch[1];
    }
    
    // Try to extract from query parameter
    const dbParam = url.match(/[?&]database=([^&]+)/);
    if (dbParam?.[1]) {
      return dbParam[1];
    }
    
    // Default to 'analytics'
    return 'analytics';
  }

  async initialize() {
    // Create database if it doesn't exist
    await this.client.query(`CREATE DATABASE IF NOT EXISTS ${this.database}`);
    
    // No need to run USE statement as ClickHouse client handles database selection
  }

  async ensureTable(model: Model) {
    const exists = await this.tableExists(model.name);
    if (!exists) {
      await this.createTable(model);
    } else {
      await this.syncColumns(model);
    }
  }

  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.client.query<{ name: string }>(`
      SELECT name FROM system.tables 
      WHERE database = '${this.database}' AND name = '${tableName}'
    `);
    return result.data.length > 0;
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

    // Use fully qualified table name
    const tableName = `${this.database}.${model.name}`;

    await this.client.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns}
      ) ENGINE = ${model.engine}
      ${orderBy}
      ${partitionBy}
    `);
  }

  async syncColumns(model: Model) {
    const existingColumns = await this.getColumns(model.name);
    const newColumns = Object.entries(model.columns)
      .filter(([name]) => !existingColumns.has(name))
      .map(([name, column]) => {
        const options = column.options || {};
        const nullable = options.nullable ? 'NULL' : 'NOT NULL';
        const defaultVal = options.default ? `DEFAULT ${options.default}` : '';
        return `ADD COLUMN ${name} ${column.type} ${nullable} ${defaultVal}`;
      });

    if (newColumns.length > 0) {
      // Use fully qualified table name
      const tableName = `${this.database}.${model.name}`;
      
      await this.client.query(`
        ALTER TABLE ${tableName}
        ${newColumns.join(',\n')}
      `);
    }
  }

  async getColumns(table: string): Promise<Set<string>> {
    const result = await this.client.query<{ name: string }>(`
      SELECT name FROM system.columns 
      WHERE database = '${this.database}' AND table = '${table}'
    `);
    return new Set(result.data.map(c => c.name));
  }

  async dropTable(tableName: string) {
    // Use fully qualified table name
    const fullTableName = `${this.database}.${tableName}`;
    await this.client.query(`DROP TABLE IF EXISTS ${fullTableName}`);
  }

  async close() {
    // TODO- Cleanup
  }
} 