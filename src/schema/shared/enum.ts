import { ColumnDefinition, TypeOptions } from '../types/base';

/**
 * Enum values (name -> numeric code mapping)
 */
export type EnumValues = Record<string, number>;

/**
 * Enum type (8-bit or 16-bit)
 */
export type EnumType = 'Enum8' | 'Enum16';

/**
 * Shared enum definition that can be reused across schemas
 */
export interface SharedEnum<T extends EnumValues> {
  /** Enum values (name -> code mapping) */
  values: T;
  
  /** Enum type (8 or 16 bit) */
  enumType: EnumType;
  
  /** Original definition string used in ClickHouse */
  definition: string;
  
  /** All possible enum names */
  names: Array<keyof T>;
  
  /** All numeric codes */
  codes: Array<number>;
  
  /** ClickHouse type string */
  clickhouseType: string;
  
  /** Get code for a enum name */
  getCode(name: keyof T): number;
  
  /** Get name for a code */
  getName(code: number): keyof T | undefined;
  
  /** Check if a name is valid for this enum */
  isValidName(name: unknown): name is keyof T;
  
  /** Check if a code is valid for this enum */
  isValidCode(code: number): boolean;
  
  /** Create a column definition for this enum type */
  type(options?: TypeOptions<keyof T>): ColumnDefinition<keyof T>;
}

/**
 * Create a shared Enum8 definition that can be used across schemas
 * 
 * @example
 * export const UserStatus = createEnum8({
 *   active: 1,
 *   inactive: 0,
 *   pending: 2
 * });
 * 
 * // In schema:
 * columns: {
 *   status: UserStatus.type({ default: 'active' })
 * }
 */
export function createEnum8<T extends EnumValues>(values: T): SharedEnum<T> {
  // Validate values are within Int8 range
  for (const [key, value] of Object.entries(values)) {
    if (value < -128 || value > 127) {
      throw new Error(`Enum8 value ${value} for key "${key}" is out of range (-128 to 127)`);
    }
  }
  
  return createSharedEnum(values, 'Enum8');
}

/**
 * Create a shared Enum16 definition that can be used across schemas
 * 
 * @example
 * export const OrderStatus = createEnum16({
 *   created: 1,
 *   processing: 2,
 *   shipped: 3,
 *   delivered: 4,
 *   cancelled: 5,
 *   returned: 6
 * });
 */
export function createEnum16<T extends EnumValues>(values: T): SharedEnum<T> {
  // Validate values are within Int16 range
  for (const [key, value] of Object.entries(values)) {
    if (value < -32768 || value > 32767) {
      throw new Error(`Enum16 value ${value} for key "${key}" is out of range (-32768 to 32767)`);
    }
  }
  
  return createSharedEnum(values, 'Enum16');
}

/**
 * Internal helper to create a shared enum
 */
function createSharedEnum<T extends EnumValues>(values: T, enumType: EnumType): SharedEnum<T> {
  const names = Object.keys(values) as Array<keyof T>;
  const codes = Object.values(values);
  
  // Generate ClickHouse enum definition string
  const definition = Object.entries(values)
    .map(([name, value]) => `'${name}' = ${value}`)
    .join(', ');
  
  const clickhouseType = `${enumType}(${definition})`;
  
  return {
    values,
    enumType,
    definition,
    names,
    codes,
    clickhouseType,
    
    getCode(name: keyof T): number {
      return values[name];
    },
    
    getName(code: number): keyof T | undefined {
      for (const [name, value] of Object.entries(values)) {
        if (value === code) return name as keyof T;
      }
      return undefined;
    },
    
    isValidName(name: unknown): name is keyof T {
      return typeof name === 'string' && name in values;
    },
    
    isValidCode(code: number): boolean {
      return codes.includes(code);
    },
    
    type(options: TypeOptions<keyof T> = {}): ColumnDefinition<keyof T> {
      return {
        _type: names[0],
        clickhouseType,
        ...options,
        isNullable: options.nullable ?? false,
      };
    }
  };
} 