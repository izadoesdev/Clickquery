import { ColumnDefinition } from './base';

export type OrderDirection = 'ASC' | 'DESC';

export interface OrderByColumn<TColumns extends Record<string, ColumnDefinition<any>>> {
  column: keyof TColumns;
  direction: OrderDirection;
}

export type OrderBy<TColumns extends Record<string, ColumnDefinition<any>>> = 
  | (keyof TColumns)[]
  | OrderByColumn<TColumns>[];

export type PartitionBy<TColumns extends Record<string, ColumnDefinition<any>>> = 
  | keyof TColumns
  | ((columns: TColumns) => string);

export function createOrderBy<TColumns extends Record<string, ColumnDefinition<any>>>(
  columns: (keyof TColumns | OrderByColumn<TColumns>)[],
): OrderByColumn<TColumns>[] {
  return columns.map(col => {
    if (typeof col === 'string' || typeof col === 'number' || typeof col === 'symbol') {
      return { column: col as keyof TColumns, direction: 'ASC' as const } as OrderByColumn<TColumns>;
    }
    return col as OrderByColumn<TColumns>;
  });
}

export function createPartitionBy<TColumns extends Record<string, ColumnDefinition<any>>>(
  column: keyof TColumns | ((columns: TColumns) => string),
): (columns: TColumns) => string {
  if (typeof column === 'function') {
    return column;
  }
  return columns => `toYYYYMM(${columns[column]})`;
} 