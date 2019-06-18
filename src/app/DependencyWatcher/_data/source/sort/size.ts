import { SortFunction, SortResult } from "./Sort";
import { ListItem } from "../../types";

export let size: SortFunction<ListItem> = <T extends ListItem>(first: T, second: T): SortResult => {
    let _first: number = first.size || 0;
    let _second: number = second.size || 0;

    return _first - _second;
};
