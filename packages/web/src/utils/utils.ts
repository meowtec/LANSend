import { customAlphabet } from 'nanoid';

export const generateId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

export const removeNull = <T>(
  array: ReadonlyArray<T | null | undefined>,
) => array.filter((x) => x != null) as T[];

export function parseJSON<T>(text: string): T | undefined;
export function parseJSON<T>(text: string, fallback: T): T;
export function parseJSON<T>(text: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
