import { z } from 'zod';

export enum ClickHouseEngine {
  MergeTree = 'MergeTree',
  ReplacingMergeTree = 'ReplacingMergeTree',
  SummingMergeTree = 'SummingMergeTree',
  AggregatingMergeTree = 'AggregatingMergeTree',
  VersionedCollapsingMergeTree = 'VersionedCollapsingMergeTree',
}

export type ColumnOptions = {
  nullable?: boolean;
  default?: unknown;
  unique?: boolean;
  primaryKey?: boolean;
  index?: boolean;
};

export type Column = {
  type: string;
  schema: z.ZodType;
  options: ColumnOptions;
};

export function Str(options: ColumnOptions = {}) {
  return {
    type: 'String',
    schema: z.string(),
    options
  };
}

export function UUID(options: ColumnOptions = {}) {
  return {
    type: 'UUID',
    schema: z.string().uuid(),
    options
  };
}

export function Bool(options: ColumnOptions = {}) {
  return {
    type: 'Boolean',
    schema: z.boolean(),
    options
  };
}

export function DateTime(options: ColumnOptions = {}) {
  return {
    type: 'DateTime',
    schema: z.date(),
    options
  };
}

export function DateTime64(options: ColumnOptions = {}) {
  return {
    type: 'DateTime64',
    schema: z.date(),
    options
  };
}

export function DateType(options: ColumnOptions = {}) {
  return {
    type: 'Date',
    schema: z.date(),
    options
  };
}

export function Date32(options: ColumnOptions = {}) {
  return {
    type: 'Date32',
    schema: z.date(),
    options
  };
}

export function JSONType(options: ColumnOptions = {}) {
  return {
    type: 'JSON',
    schema: z.any(),
    options
  };
}

export function id(options: ColumnOptions = {}) {
  return {
    type: 'UUID',
    schema: z.string().uuid(),
    options: { ...options, primaryKey: true }
  };
}

export function timestamp(options: ColumnOptions = {}) {
  return {
    type: 'DateTime',
    schema: z.date(),
    options: { ...options, index: true }
  };
} 