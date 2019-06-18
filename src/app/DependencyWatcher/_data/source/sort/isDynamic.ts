import { SortFunction, SortResult } from "./Sort";
import { ListItem } from "../../types";


export let isDynamic: SortFunction<ListItem> = <T extends ListItem>(first: T, secont: T): SortResult => {
    if (first.isDynamic == secont.isDynamic) {
        return SortResult.equal;
    }
    if (first.isDynamic) {
        return SortResult.down;
    }
    return SortResult.up;
};
