export enum SortResult {
   up = -1,
   down = 1,
   equal = 0
}

export type SortFunction<T> = (first: T, second: T) => SortResult;
