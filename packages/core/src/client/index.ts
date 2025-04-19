import type { ClickHouseConfig, QueryOptions, QueryResult } from '../types/client.js';
import type { Model } from '../schema/defineModel.js';
import type { OrderBy } from '../schema/types/ordering.js';
import { createClient as createClickHouseClient } from "@clickhouse/client";
import type { NodeClickHouseClientConfigOptions } from "@clickhouse/client/dist/config";

interface QueryBuilder<T extends Model> {
  where(column: keyof T['columns'], operator: string, value: unknown): QueryBuilder<T>;
  andWhere(column: keyof T['columns'], operator: string, value: unknown): QueryBuilder<T>;
  orderBy(column: keyof T['columns'], direction: 'ASC' | 'DESC'): QueryBuilder<T>;
  limit(count: number): Promise<QueryResult<T>>;
}

class QueryBuilderImpl<T extends Model> implements QueryBuilder<T> {
  private query: string;
  private conditions: string[];

  constructor(private client: ClickQueryClient, private table: string) {
    this.query = `SELECT * FROM ${table}`;
    this.conditions = [];
  }

  where(column: keyof T['columns'], operator: string, value: unknown): QueryBuilder<T> {
    this.conditions.push(`${String(column)} ${operator} ${this.formatValue(value)}`);
    return this;
  }

  andWhere(column: keyof T['columns'], operator: string, value: unknown): QueryBuilder<T> {
    this.conditions.push(`AND ${String(column)} ${operator} ${this.formatValue(value)}`);
    return this;
  }

  orderBy(column: keyof T['columns'], direction: 'ASC' | 'DESC'): QueryBuilder<T> {
    this.query += ` ORDER BY ${String(column)} ${direction}`;
    return this;
  }

  async limit(count: number): Promise<QueryResult<T>> {
    if (this.conditions.length > 0) {
      this.query += ` WHERE ${this.conditions.join(' ')}`;
    }
    this.query += ` LIMIT ${count}`;
    return this.execute();
  }

  private formatValue(value: unknown): string {
    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value}'`;
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return String(value);
  }

  private async execute(): Promise<QueryResult<T>> {
    // Use the client's query method which will handle all the necessary formatting
    return this.client.query<T>(this.query);
  }
}

export class ClickQueryClient {
  private client: ReturnType<typeof createClickHouseClient>;

  constructor(config: ClickHouseConfig) {
    const options: NodeClickHouseClientConfigOptions = {
      max_open_connections: 30,
      request_timeout: 60000,
      keep_alive: {
        enabled: true,
        idle_socket_ttl: 8000,
      },
      compression: {
        request: true,
      },
      clickhouse_settings: {
        date_time_input_format: 'best_effort',
        ...config.clickhouse_settings,
      },
    };

    this.client = createClickHouseClient({
      url: config.url,
      ...options,
    });
  }

  async query<T = unknown>(query: string, options?: QueryOptions): Promise<QueryResult<T>> {
    try {
      // Remove any FORMAT clause from the query if present
      let cleanQuery = query;
      if (query.toUpperCase().includes('FORMAT')) {
        cleanQuery = query.replace(/FORMAT\s+[A-Za-z]+/i, '').trim();
      }
      
      const result = await this.client.query({
        query: cleanQuery,
        format: 'JSON',
        query_id: options?.query_id,
      });

      let response: unknown[];
      try {
        const responseText = await result.text();
        response = responseText ? JSON.parse(responseText) : [];
      } catch (parseError) {
        // Handle empty responses or invalid JSON
        response = [];
      }

      const data = Array.isArray(response) ? response as unknown as T[] : [response] as unknown as T[];
      
      return {
        data,
        rows: data.length,
        statistics: {
          elapsed: 0,
          rows_read: 0,
          bytes_read: 0,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Query failed: ${error.message}`);
      }
      throw error;
    }
  }

  select<T extends Model>(model: T): QueryBuilder<T> {
    return new QueryBuilderImpl<T>(this, model.name);
  }

  async insert<T extends Model>(model: T, data: Partial<T['columns']>): Promise<QueryResult<T>> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map(v => this.formatValue(v)).join(', ');
    return this.query(`INSERT INTO ${model.name} (${columns}) VALUES (${values})`);
  }

  private formatValue(value: unknown): string {
    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value}'`;
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return String(value);
  }
}

export function createClient(config: ClickHouseConfig): ClickQueryClient {
  return new ClickQueryClient(config);
} 