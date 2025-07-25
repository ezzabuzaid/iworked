export * from './lib/time-slots.ts';
export * from './lib/validators.ts';

export function isNullOrUndefined(value: any): value is undefined | null {
  return value === undefined || value === null;
}

export function notNullOrUndefined<T>(
  value: T,
): value is Exclude<T, null | undefined> {
  return !isNullOrUndefined(value);
}

export function removeTrailingSlashes(path: string, keepLastOne = false) {
  while (path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path + (keepLastOne ? '/' : '');
}
