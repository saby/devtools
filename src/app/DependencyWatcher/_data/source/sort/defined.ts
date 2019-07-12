import { SortFunction, SortResult } from "./Sort";
import { dependency } from "../../types";

export let defined: SortFunction<dependency.Item> = <T extends dependency.Item>(first: T, secont: T): SortResult => {
    if (first.defined == secont.defined) {
        return SortResult.equal;
    }
    if (first.defined) {
        return SortResult.down;
    }
    return SortResult.up;
};
