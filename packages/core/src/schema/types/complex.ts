import { z } from 'zod';
import type { Column, ColumnOptions } from './base';

export function ArrayType(elementType: Column, options: ColumnOptions = {}): Column {
  return {
    type: `Array(${elementType.type})`,
    schema: z.array(elementType.schema),
    options
  };
}

export function TupleType(elementTypes: Column[], options: ColumnOptions = {}): Column {
  return {
    type: `Tuple(${elementTypes.map(t => t.type).join(', ')})`,
    schema: z.tuple(elementTypes.map(t => t.schema) as [z.ZodType, ...z.ZodType[]]),
    options
  };
}

export function MapType(keyType: Column, valueType: Column, options: ColumnOptions = {}): Column {
  return {
    type: `Map(${keyType.type}, ${valueType.type})`,
    schema: z.record(keyType.schema, valueType.schema),
    options
  };
}

export function FixedString(length: number, options: ColumnOptions = {}): Column {
  if (length < 1 || length > 255) {
    throw new Error('FixedString length must be between 1 and 255');
  }
  
  return {
    type: `FixedString(${length})`,
    schema: z.string().length(length),
    options
  };
} 