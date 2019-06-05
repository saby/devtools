import { ListItem } from "../../types";

export enum SortResult {
    up    = -1,
    down  = 1,
    equal = 0
}

export type SortFunction<T extends ListItem> = (first: T, secont: T) => SortResult;
