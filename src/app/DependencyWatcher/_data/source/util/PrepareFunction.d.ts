export type PrepareFunction<T> = (set: T[]) => T[] | Promise<T[]>;
