import { z } from 'zod';
import type { Column, ColumnOptions } from './base';

export function createEnum8(values: Record<string, number>) {
  return (options: ColumnOptions = {}): Column => {
    const enumValues = Object.keys(values);
    return {
      type: 'Enum8',
      schema: z.enum(enumValues as [string, ...string[]]),
      options
    };
  };
}

export function createEnum16(values: Record<string, number>) {
  return (options: ColumnOptions = {}): Column => {
    const enumValues = Object.keys(values);
    return {
      type: 'Enum16',
      schema: z.enum(enumValues as [string, ...string[]]),
      options
    };
  };
} 