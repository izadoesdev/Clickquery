import type { Column } from './base';

export type OrderDirection = 'ASC' | 'DESC';

export type OrderByColumn = {
  column: string;
  direction: OrderDirection;
};

export type OrderBy = string[] | OrderByColumn[];

export type PartitionBy = string | ((columns: Record<string, Column>) => string);

export function createOrderBy(columns: (string | OrderByColumn)[]): OrderByColumn[] {
  return columns.map(col => {
    if (typeof col === 'string') {
      return { column: col, direction: 'ASC' as const };
    }
    return col;
  });
}

export function createPartitionBy(
  column: string | ((columns: Record<string, Column>) => string)
): (columns: Record<string, Column>) => string {
  if (typeof column === 'function') {
    return column;
  }
  return columns => `toYYYYMM(${columns[column].type})`;
} 