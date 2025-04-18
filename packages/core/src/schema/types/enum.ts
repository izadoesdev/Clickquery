import { ColumnDefinition, TypeOptions } from './base';

// Type for enum values mapping
export type EnumValues = Record<string, number>;

/**
 * Creates an Enum8 type column
 * @param values Mapping of enum values to their numeric codes (range -128 to 127)
 * @param options Type options
 * @returns An Enum8 column definition
 */
export function Enum8<T extends EnumValues>(
  values: T,
  options: TypeOptions<keyof T> = {}
): ColumnDefinition<keyof T> {
  // Validate values fit within Int8 range (-128 to 127)
  for (const [key, value] of Object.entries(values)) {
    if (value < -128 || value > 127) {
      throw new Error(`Enum8 value ${value} for key "${key}" is out of range (-128 to 127)`);
    }
  }

  const enumDefStr = Object.entries(values)
    .map(([name, value]) => `'${name}' = ${value}`)
    .join(', ');
  
  return {
    _type: Object.keys(values)[0] as keyof T,
    clickhouseType: `Enum8(${enumDefStr})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
}

/**
 * Creates an Enum16 type column
 * @param values Mapping of enum values to their numeric codes (range -32768 to 32767)
 * @param options Type options
 * @returns An Enum16 column definition
 */
export function Enum16<T extends EnumValues>(
  values: T,
  options: TypeOptions<keyof T> = {}
): ColumnDefinition<keyof T> {
  // Validate values fit within Int16 range (-32768 to 32767)
  for (const [key, value] of Object.entries(values)) {
    if (value < -32768 || value > 32767) {
      throw new Error(`Enum16 value ${value} for key "${key}" is out of range (-32768 to 32767)`);
    }
  }

  const enumDefStr = Object.entries(values)
    .map(([name, value]) => `'${name}' = ${value}`)
    .join(', ');
  
  return {
    _type: Object.keys(values)[0] as keyof T,
    clickhouseType: `Enum16(${enumDefStr})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
} 