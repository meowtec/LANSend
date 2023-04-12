export type ReadonlyRecord<K extends string | number | symbol, T> = {
  readonly [P in K]: T;
};
