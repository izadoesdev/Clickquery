import { ColumnDefinition, TypeOptions } from './base';

/**
 * Creates an Array type column
 * @param element The element type
 * @param options Type options
 * @returns An Array column definition
 */
export function ArrayType<T, Def extends ColumnDefinition<T>>(
  element: Def,
  options: TypeOptions<T[]> = {}
): ColumnDefinition<T[]> {
  return {
    _type: [] as T[],
    clickhouseType: `Array(${element.clickhouseType})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
}

/**
 * Creates a Tuple type column
 * @param elements The element types
 * @param options Type options
 * @returns A Tuple column definition
 */
export function TupleType<Defs extends ColumnDefinition<any>[]>(
  elements: [...Defs],
  options: TypeOptions<{ [K in keyof Defs]: Defs[K]['_type'] }> = {}
): ColumnDefinition<{ [K in keyof Defs]: Defs[K]['_type'] }> {
  const typesStr = elements.map(e => e.clickhouseType).join(', ');
  return {
    _type: [] as unknown as { [K in keyof Defs]: Defs[K]['_type'] },
    clickhouseType: `Tuple(${typesStr})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
}

/**
 * Creates a Map type column
 * @param keyType The key type
 * @param valueType The value type
 * @param options Type options
 * @returns A Map column definition
 */
export function MapType<K, V, KDef extends ColumnDefinition<K>, VDef extends ColumnDefinition<V>>(
  keyType: KDef,
  valueType: VDef,
  options: TypeOptions<Record<K & (string | number), V>> = {}
): ColumnDefinition<Record<K & (string | number), V>> {
  return {
    _type: {} as Record<K & (string | number), V>,
    clickhouseType: `Map(${keyType.clickhouseType}, ${valueType.clickhouseType})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
}

/**
 * Creates a FixedString type column
 * @param n Length of the fixed string
 * @param options Type options
 * @returns A FixedString column definition
 */
export function FixedString(n: number, options: TypeOptions<string> = {}): ColumnDefinition<string> {
  if (n <= 0) throw new Error('FixedString length must be positive');
  return {
    _type: '' as string,
    clickhouseType: `FixedString(${n})`,
    ...options,
    isNullable: options.nullable ?? false,
  };
} 