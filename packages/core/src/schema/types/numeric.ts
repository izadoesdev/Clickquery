import { z } from 'zod';
import type { Column, ColumnOptions } from './base';

export function Int8(options: ColumnOptions = {}): Column {
  return {
    type: 'Int8',
    schema: z.number().int().min(-128).max(127),
    options
  };
}

export function Int16(options: ColumnOptions = {}): Column {
  return {
    type: 'Int16',
    schema: z.number().int().min(-32768).max(32767),
    options
  };
}

export function Int32(options: ColumnOptions = {}): Column {
  return {
    type: 'Int32',
    schema: z.number().int().min(-2147483648).max(2147483647),
    options
  };
}

export function Int64(options: ColumnOptions = {}): Column {
  return {
    type: 'Int64',
    schema: z.bigint(),
    options
  };
}

export function UInt8(options: ColumnOptions = {}): Column {
  return {
    type: 'UInt8',
    schema: z.number().int().min(0).max(255),
    options
  };
}

export function UInt16(options: ColumnOptions = {}): Column {
  return {
    type: 'UInt16',
    schema: z.number().int().min(0).max(65535),
    options
  };
}

export function UInt32(options: ColumnOptions = {}): Column {
  return {
    type: 'UInt32',
    schema: z.number().int().min(0).max(4294967295),
    options
  };
}

export function UInt64(options: ColumnOptions = {}): Column {
  return {
    type: 'UInt64',
    schema: z.bigint().min(0n),
    options
  };
}

export function Float32(options: ColumnOptions = {}): Column {
  return {
    type: 'Float32',
    schema: z.number(),
    options
  };
}

export function Float64(options: ColumnOptions = {}): Column {
  return {
    type: 'Float64',
    schema: z.number(),
    options
  };
}

export function Decimal(precision: number, scale: number, options: ColumnOptions = {}): Column {
  return {
    type: `Decimal(${precision}, ${scale})`,
    schema: z.number().multipleOf(1 / (10 ** scale)),
    options
  };
}

export function Decimal64(precision: number, options: ColumnOptions = {}): Column {
  return Decimal(precision, 4, options);
} 