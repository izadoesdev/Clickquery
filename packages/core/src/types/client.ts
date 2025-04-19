import { z } from 'zod';

export interface ClickHouseConfig {
  url: string;
  clickhouse_settings?: Record<string, number>;
}

// Config validation
export const ClickHouseConfigSchema = z.object({
  url: z.string().url(),
  clickhouse_settings: z.record(z.number()).optional(),
});

export interface QueryOptions {
  format?: 'JSON' | 'JSONEachRow';
  query_id?: string;
  max_execution_time?: number;
}

// Query options validation
export const QueryOptionsSchema = z.object({
  format: z.enum(['JSON', 'JSONEachRow']).optional(),
  query_id: z.string().optional(),
  max_execution_time: z.number().int().positive().optional(),
});


export interface QueryResult<T> {
  data: T[];
  rows: number;
  statistics: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

// Query result validation
export const QueryResultSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  data: z.array(dataSchema),
  rows: z.number().int().nonnegative(),
  statistics: z.object({
    elapsed: z.number().nonnegative(),
    rows_read: z.number().int().nonnegative(),
    bytes_read: z.number().int().nonnegative(),
  }),
});


export type WhereOperator = 
  | '=' | '!=' | '>' | '>=' | '<' | '<='
  | 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE'
  | 'IS NULL' | 'IS NOT NULL';

// Where operators
export const WhereOperatorSchema = z.enum([
  '=', '!=', '>', '>=', '<', '<=',
  'IN', 'NOT IN', 'LIKE', 'NOT LIKE',
  'IS NULL', 'IS NOT NULL'
]);


export interface WhereClause {
  column: string;
  operator: WhereOperator;
  value: unknown;
  type: 'AND' | 'OR';
}

// Where clause validation
export const WhereClauseSchema = z.object({
  column: z.string(),
  operator: WhereOperatorSchema,
  value: z.unknown(),
  type: z.enum(['AND', 'OR']),
});


export interface OrderClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

// Order clause validation
export const OrderClauseSchema = z.object({
  column: z.string(),
  direction: z.enum(['ASC', 'DESC']),
});


export interface QueryBuilder {
  // Basic query methods
  select(columns?: string[]): QueryBuilder;
  from(table: string): QueryBuilder;
  
  // Where conditions with validation
  where(column: string, operator: WhereOperator, value: unknown): QueryBuilder;
  andWhere(column: string, operator: WhereOperator, value: unknown): QueryBuilder;
  orWhere(column: string, operator: WhereOperator, value: unknown): QueryBuilder;
  
  // Ordering with validation
  orderBy(column: string, direction: 'ASC' | 'DESC'): QueryBuilder;
  
  // Pagination with validation
  limit(count: number): QueryBuilder;
  offset(count: number): QueryBuilder;
  
  // Grouping with validation
  groupBy(columns: string[]): QueryBuilder;
  having(column: string, operator: WhereOperator, value: unknown): QueryBuilder;
  
  // Joins with validation
  join(table: string, condition: string): QueryBuilder;
  leftJoin(table: string, condition: string): QueryBuilder;
  rightJoin(table: string, condition: string): QueryBuilder;
  
  // Execution with schema validation
  execute<T>(schema: z.ZodType<T>): Promise<QueryResult<T>>;
  toSQL(): string;
  
  // Validation methods
  validate(): boolean;
  getErrors(): string[];
}

// Query builder state
export interface QueryBuilderState {
  select: string[];
  from: string;
  where: WhereClause[];
  orderBy: OrderClause[];
  limit?: number;
  offset?: number;
  groupBy: string[];
  having: WhereClause[];
  joins: {
    type: 'INNER' | 'LEFT' | 'RIGHT';
    table: string;
    condition: string;
  }[];
} 