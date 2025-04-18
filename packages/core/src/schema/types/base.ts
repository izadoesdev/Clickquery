import { generateID, IDOptions, IDStrategy, now } from '../../utils/index';

export enum ClickHouseEngine {
  MergeTree = 'MergeTree',
  ReplacingMergeTree = 'ReplacingMergeTree',
  SummingMergeTree = 'SummingMergeTree',
  AggregatingMergeTree = 'AggregatingMergeTree',
  VersionedCollapsingMergeTree = 'VersionedCollapsingMergeTree',
}

export interface ColumnDefinition<T = any> {
  _type: T;
  clickhouseType: string;
  isNullable?: boolean;
  isLowCardinality?: boolean;
  default?: T | (() => T);
  nullable?: boolean;
  optional?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  index?: boolean;
}

/**
 * Options for column type definitions
 * 
 * @template T The type of values stored in the column
 * @property {T | (() => T)} [default] - Default value or function returning a value
 * @property {boolean} [nullable] - Whether the column can contain NULL values 
 *   (preferred over using the Nullable() wrapper)
 * @property {boolean} [optional] - Whether the column is optional in insert operations
 * @property {boolean} [unique] - Whether the column values should be unique
 * @property {boolean} [primaryKey] - Whether this column is part of the primary key
 * @property {boolean} [index] - Whether this column should be indexed
 */
export type TypeOptions<T> = {
  default?: T | (() => T);
  nullable?: boolean;
  optional?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  index?: boolean;
};

export function Str(options: TypeOptions<string> = {}): ColumnDefinition<string> {
  return {
    _type: '' as string,
    clickhouseType: 'String',
    ...options,
    isNullable: options.nullable ?? false,
  };
}

export function UUID(options: TypeOptions<string> & { 
  strategy?: IDStrategy | string;
  size?: number;
  customGenerator?: () => string;
} = {}): ColumnDefinition<string> {
  const { strategy, size, customGenerator, ...rest } = options;
  const idOptions: IDOptions = { strategy, size, customGenerator };
  
  return {
    _type: '' as string,
    clickhouseType: 'UUID',
    ...rest,
    isNullable: rest.nullable ?? false,
  };
}

export function Bool(options: TypeOptions<boolean> = {}): ColumnDefinition<boolean> {
  return {
    _type: false as boolean,
    clickhouseType: 'Boolean',
    ...options,
    isNullable: options.nullable ?? false,
  };
}

export function DateTime(options: TypeOptions<Date> & { precision?: number } = {}): ColumnDefinition<Date> {
  const { precision, ...rest } = options;
  return {
    _type: new Date(),
    clickhouseType: `DateTime${precision ? `(${precision})` : ''}`,
    ...rest,
    isNullable: rest.nullable ?? false,
  };
}

export function DateTime64(options: TypeOptions<Date> & { precision?: number } = {}): ColumnDefinition<Date> {
  const { precision = 3, ...rest } = options;
  if (precision < 0 || precision > 9) throw new Error('DateTime64 precision must be between 0 and 9');
  return {
    _type: new Date(),
    clickhouseType: `DateTime64(${precision})`,
    ...rest,
    isNullable: rest.nullable ?? false,
  };
}

export function DateType(options: TypeOptions<Date> = {}): ColumnDefinition<Date> {
  return {
    _type: new Date(),
    clickhouseType: 'Date',
    ...options,
    isNullable: options.nullable ?? false,
  };
}

export function Date32(options: TypeOptions<Date> = {}): ColumnDefinition<Date> {
  return {
    _type: new Date(),
    clickhouseType: 'Date32',
    ...options,
    isNullable: options.nullable ?? false,
  };
}

export function JSON<T = any>(options: TypeOptions<T> = {}): ColumnDefinition<T> {
  return {
    _type: {} as T,
    clickhouseType: `Object('json')`,
    ...options,
    isNullable: options.nullable ?? false,
  };
}

/**
 * Makes a column type nullable.
 * 
 * @deprecated For consistency, please use the `{ nullable: true }` option instead:
 * ```
 * // Instead of: Nullable(Str())
 * // Use: Str({ nullable: true })
 * ```
 * 
 * This wrapper is kept for backward compatibility but may be removed in future versions.
 */
export function Nullable<TDef extends ColumnDefinition<any>>(
  typeDefinition: TDef
): ColumnDefinition<TDef['_type'] | null> {
  return {
    ...typeDefinition,
    _type: null as TDef['_type'] | null,
    clickhouseType: `Nullable(${typeDefinition.clickhouseType})`,
    isNullable: true,
    nullable: true,
  };
}

export function LowCardinality<TDef extends ColumnDefinition<any>>(
  typeDefinition: TDef
): ColumnDefinition<TDef['_type']> {
  return {
    ...typeDefinition,
    clickhouseType: `LowCardinality(${typeDefinition.clickhouseType})`,
    isLowCardinality: true,
  };
}

/**
 * Helper for creating a UUID primary key with auto-generation
 * @returns A UUID column definition configured as primary key with auto-generation
 */
export function id(options: Omit<TypeOptions<string>, 'primaryKey'> & {
  strategy?: IDStrategy | string;
  size?: number;
  customGenerator?: () => string;
} = {}): ColumnDefinition<string> {
  const { strategy, size, customGenerator, ...rest } = options;
  
  return UUID({
    ...rest,
    strategy,
    size,
    customGenerator,
    default: options.default ?? (() => generateID({ strategy, size, customGenerator })),
    primaryKey: true,
  });
}

/**
 * Helper for creating a DateTime column with current timestamp default
 * @returns A DateTime column definition with current timestamp default
 */
export function timestamp(options: Omit<TypeOptions<Date>, 'default'> & { precision?: number, autoUpdate?: boolean } = {}): ColumnDefinition<Date> {
  const { autoUpdate, ...rest } = options;
  return DateTime({
    ...rest,
    default: now,
    index: options.index ?? true,
  });
} 