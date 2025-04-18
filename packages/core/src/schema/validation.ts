import { ColumnDefinition, TypeOptions } from './types/base';
import { Model } from './defineModel';
import { ClickHouseEngine } from './types';

/**
 * Validation errors that can occur during schema validation
 */
export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Validates a model definition
 */
export function validateModel<TColumns extends Record<string, ColumnDefinition<any>>>(
  model: Model<TColumns>
): void {
  // Validate model name
  if (!model.name || typeof model.name !== 'string') {
    throw new SchemaValidationError('Model name must be a non-empty string');
  }

  // Validate columns
  if (!model.columns || typeof model.columns !== 'object' || Object.keys(model.columns).length === 0) {
    throw new SchemaValidationError('Model must have at least one column');
  }

  // Validate engine
  if (!model.engine || !Object.values(ClickHouseEngine).includes(model.engine)) {
    throw new SchemaValidationError('Model must have a valid engine');
  }

  // Validate each column
  for (const [columnName, column] of Object.entries(model.columns)) {
    validateColumn(columnName, column);
  }

  // Validate orderBy if present
  if (model.orderBy) {
    validateOrderBy(model.orderBy, model.columns);
  }

  // Validate partitionBy if present
  if (model.partitionBy) {
    validatePartitionBy(model.partitionBy, model.columns);
  }
}

/**
 * Validates a column definition
 */
function validateColumn(name: string, column: ColumnDefinition<any>): void {
  if (!column.clickhouseType) {
    throw new SchemaValidationError(`Column ${name} must have a clickhouseType`);
  }

  // Validate default value if present
  if (column.default !== undefined) {
    if (typeof column.default === 'function') {
      // Function defaults are valid
      return;
    }

    // Check if default value matches column type
    const type = column._type;
    if (type !== undefined && typeof column.default !== typeof type) {
      throw new SchemaValidationError(
        `Default value for column ${name} must match column type (expected ${typeof type}, got ${typeof column.default})`
      );
    }
  }
}

/**
 * Validates orderBy configuration
 */
function validateOrderBy<TColumns extends Record<string, ColumnDefinition<any>>>(
  orderBy: (keyof TColumns)[] | { column: keyof TColumns; direction: 'ASC' | 'DESC' }[],
  columns: TColumns
): void {
  if (!Array.isArray(orderBy)) {
    throw new SchemaValidationError('orderBy must be an array');
  }

  for (const item of orderBy) {
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'symbol') {
      if (!(item in columns)) {
        throw new SchemaValidationError(`Order column ${String(item)} does not exist in model`);
      }
    } else if (item && typeof item === 'object') {
      if (!('column' in item) || !('direction' in item)) {
        throw new SchemaValidationError('Order item must have column and direction properties');
      }
      if (!(item.column in columns)) {
        throw new SchemaValidationError(`Order column ${String(item.column)} does not exist in model`);
      }
      if (item.direction !== 'ASC' && item.direction !== 'DESC') {
        throw new SchemaValidationError('Order direction must be either ASC or DESC');
      }
    } else {
      throw new SchemaValidationError('Invalid orderBy item type');
    }
  }
}

/**
 * Validates partitionBy configuration
 */
function validatePartitionBy<TColumns extends Record<string, ColumnDefinition<any>>>(
  partitionBy: keyof TColumns | ((columns: TColumns) => string),
  columns: TColumns
): void {
  if (typeof partitionBy === 'function') {
    // Function partitionBy is valid
    return;
  }

  if (!(partitionBy in columns)) {
    throw new SchemaValidationError(`Partition column ${String(partitionBy)} does not exist in model`);
  }
}

/**
 * Converts a TypeScript value to its ClickHouse representation
 */
export function toClickHouseValue(value: any, column: ColumnDefinition<any>): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  switch (column.clickhouseType) {
    case 'String':
      return `'${String(value).replace(/'/g, "''")}'`;
    case 'UUID':
      return `'${value}'`;
    case 'Boolean':
      return value ? '1' : '0';
    case 'DateTime':
    case 'DateTime64':
    case 'Date':
    case 'Date32':
      return `'${value.toISOString()}'`;
    case 'Object(\'json\')':
      return `'${JSON.stringify(value)}'`;
    default:
      return String(value);
  }
}

/**
 * Converts a ClickHouse value to its TypeScript representation
 */
export function fromClickHouseValue(value: string, column: ColumnDefinition<any>): any {
  if (value === 'NULL') {
    return null;
  }

  switch (column.clickhouseType) {
    case 'String':
      return value.slice(1, -1).replace(/''/g, "'");
    case 'UUID':
      return value.slice(1, -1);
    case 'Boolean':
      return value === '1';
    case 'DateTime':
    case 'DateTime64':
    case 'Date':
    case 'Date32':
      return new Date(value.slice(1, -1));
    case 'Object(\'json\')':
      return JSON.parse(value.slice(1, -1));
    default:
      return value;
  }
} 