import { ListItem } from "../../types";

export enum SortResult {
    up = -1,
    down  = 1,
    equal = 0
}

export type SortFunction<T extends ListItem = ListItem> = (first: T, second: T) => SortResult;
