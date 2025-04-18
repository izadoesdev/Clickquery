import { ColumnDefinition, TypeOptions } from './base';

// Generic numeric type factory
function intFactory<T extends number>(name: string) {
  return (options: TypeOptions<T> = {}): ColumnDefinition<T> => ({
    _type: 0 as T,
    clickhouseType: name,
    ...options,
    isNullable: options.nullable ?? false,
  });
}

// Integer types
export const Int8 = intFactory<number>('Int8');
export const Int16 = intFactory<number>('Int16');
export const Int32 = intFactory<number>('Int32');
export const Int64 = intFactory<number>('Int64');

// Unsigned integer types
export const UInt8 = intFactory<number>('UInt8');
export const UInt16 = intFactory<number>('UInt16');
export const UInt32 = intFactory<number>('UInt32');
export const UInt64 = intFactory<number>('UInt64');

// Floating point types
export const Float32 = intFactory<number>('Float32');
export const Float64 = intFactory<number>('Float64');

// Decimal types with precision and scale
export function Decimal(precision: number, scale: number, options: TypeOptions<number> = {}): ColumnDefinition<number> {
  if (precision < 1 || precision > 76) {
    throw new Error('Decimal precision must be between 1 and 76');
  }
  if (scale < 0 || scale > precision) {
    throw new Error('Decimal scale must be between 0 and precision');
  }
  
  return {
    _type: 0,
    clickhouseType: `Decimal(${precision}, ${scale})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
}

// Decimal64 is a special case with 18 digits precision
export function Decimal64(scale: number, options: TypeOptions<number> = {}): ColumnDefinition<number> {
  if (scale < 0 || scale > 18) {
    throw new Error('Decimal64 scale must be between 0 and 18');
  }
  
  return {
    _type: 0,
    clickhouseType: `Decimal64(${scale})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
} 