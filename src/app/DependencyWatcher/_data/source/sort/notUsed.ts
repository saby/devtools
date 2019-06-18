import { SortFunction, SortResult } from "./Sort";
import { dependency } from "../../types";

export let notUsed: SortFunction<dependency.Item> = <T extends dependency.Item>(first: T, secont: T): SortResult => {
    if (!!first.notUsed == !!secont.notUsed) {
        return SortResult.equal;
    }
    if (first.notUsed) {
        return SortResult.down;
    }
    return SortResult.up;
};
