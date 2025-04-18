import type { ClickHouseEngine } from './types';
import type { OrderBy, PartitionBy } from './types/ordering';
import type { Column } from './types/base';

export interface Model {
  name: string;
  columns: Record<string, Column>;
  engine: ClickHouseEngine;
  orderBy?: OrderBy;
  partitionBy?: PartitionBy;
  primaryKey?: string[];
}

export type DefineModelOptions = {
  name: string;
  columns: Record<string, Column>;
  engine: ClickHouseEngine;
  orderBy?: OrderBy;
  partitionBy?: PartitionBy;
  primaryKey?: string[];
};

export function defineModel(options: DefineModelOptions): Model {
  if (!options.name) throw new Error('Model name is required.');
  if (!options.columns || Object.keys(options.columns).length === 0) throw new Error('Model columns are required.');
  if (!options.engine) throw new Error('Model engine is required.');
  return { ...options };
}