import { ColumnDefinition, ClickHouseEngine } from './types';
import { OrderBy, PartitionBy } from './types/ordering';

export interface Model<TColumns extends Record<string, ColumnDefinition<any>>> {
  name: string;
  columns: TColumns;
  engine: ClickHouseEngine;
  orderBy?: OrderBy<TColumns>;
  partitionBy?: PartitionBy<TColumns>;
  primaryKey?: (keyof TColumns)[];
}

export type DefineModelOptions<TColumns extends Record<string, ColumnDefinition<any>>> = {
  name: string;
  columns: TColumns;
  engine: ClickHouseEngine;
  orderBy?: OrderBy<TColumns>;
  partitionBy?: PartitionBy<TColumns>;
  primaryKey?: (keyof TColumns)[];
};

export function defineModel<TColumns extends Record<string, ColumnDefinition<any>>>(
  options: DefineModelOptions<TColumns>
): Model<TColumns> {
  if (!options.name) throw new Error('Model name is required.');
  if (!options.columns || Object.keys(options.columns).length === 0) throw new Error('Model columns are required.');
  if (!options.engine) throw new Error('Model engine is required.');
  return { ...options };
}

export type { ColumnDefinition }; 