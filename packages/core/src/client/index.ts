import type { ClickHouseConfig, QueryOptions, QueryResult } from '../types/client.js';
import type { Model } from '../schema/defineModel.js';
import type { OrderBy } from '../schema/types/ordering.js';
import clickHouseOG from './ch.js';

interface QueryBuilder<T extends Model> {
  where(column: keyof T['columns'], operator: string, value: unknown): QueryBuilder<T>;
  andWhere(column: keyof T['columns'], operator: string, value: unknown): QueryBuilder<T>;
  orderBy(column: keyof T['columns'], direction: 'ASC' | 'DESC'): QueryBuilder<T>;
  limit(count: number): Promise<QueryResult<T>>;
}

class QueryBuilderImpl<T extends Model> implements QueryBuilder<T> {
  private query: string;
  private conditions: string[];

  constructor(private client: typeof clickHouseOG, private table: string) {
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
    const result = await this.client.query({
      query: this.query,
      format: 'JSON',
    });

    const response = await result.json();
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
  }
}

export class ClickQueryClient {
  private client: typeof clickHouseOG;

  constructor(config: ClickHouseConfig) {
    this.client = clickHouseOG;
  }

  async query<T = unknown>(query: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const result = await this.client.query({
      query,
      format: options?.format || 'JSON',
      query_id: options?.query_id,
    });

    const response = await result.json();
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
  }

  select<T extends Model>(model: T): QueryBuilder<T> {
    return new QueryBuilderImpl<T>(this.client, model.name);
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