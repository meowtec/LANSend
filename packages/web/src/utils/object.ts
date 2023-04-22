export const fromPairs = <T>(list: Array<[string | number, T]>): Record<string, T> => {
  const record: Record<string, T> = {};
  list.forEach(([key, value]) => {
    record[key] = value;
  });
  return record;
};

export function mapValues<T extends object, R>(
  obj: T,
  produce: <K extends keyof T>(val: T[K], key: K) => R,
) {
  const result = {} as Record<keyof T, R>;

  Object.keys(obj).forEach((key) => {
    result[key as keyof T] = produce(obj[key as keyof T], key as keyof T);
  });

  return result;
}

export function arrayToMap<T>(array: readonly T[], keyFn: (item: T) => string): Record<string, T> {
  return array.reduce((draftMap, item) => {
    draftMap[keyFn(item)] = item;
    return draftMap;
  }, {} as Record<string, T>);
}
