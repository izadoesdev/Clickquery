import { v4 as uuidv4 } from 'uuid';
import { v6 as uuidv6 } from 'uuid';
import { nanoid } from 'nanoid';

/**
 * Different ID generation strategies
 */
export enum IDStrategy {
  UUIDv4 = 'uuidv4',
  UUIDv6 = 'uuidv6',
  NanoID = 'nanoid',
  Custom = 'custom',
}

/**
 * Options for ID generation
 */
export type IDOptions = {
  strategy?: IDStrategy | string;
  size?: number; // For nanoid
  customGenerator?: () => string; // For custom strategy
};

/**
 * Generates a unique ID string based on the provided strategy
 * @param options Options for ID generation
 * @returns A unique ID string
 */
export function generateID(options: IDOptions = {}): string {
  const { strategy = IDStrategy.UUIDv4, size = 21, customGenerator } = options;
  
  switch(strategy) {
    case IDStrategy.UUIDv4:
      return generateUUIDv4();
    case IDStrategy.UUIDv6:
      return generateUUIDv6();
    case IDStrategy.NanoID:
      return generateNanoID(size);
    case IDStrategy.Custom:
      if (typeof customGenerator !== 'function') {
        throw new Error('Custom ID generation strategy requires a customGenerator function');
      }
      return customGenerator();
    default:
      return generateUUIDv4();
  }
}

/**
 * Generates a UUID v4 string using the uuid library
 * @returns A random UUID v4 string
 */
export function generateUUIDv4(): string {
  return uuidv4();
}

/**
 * Generates a UUID v6 string (time-based) using the uuid library
 * @returns A UUID v6 string
 */
export function generateUUIDv6(): string {
  return uuidv6();
}

/**
 * Generates a NanoID string using the nanoid library
 * @param size The size of the ID (default: 21)
 * @returns A NanoID string
 */
export function generateNanoID(size: number = 21): string {
  return nanoid(size);
}

// Legacy function for backward compatibility
export const generateUUID = generateUUIDv4; 