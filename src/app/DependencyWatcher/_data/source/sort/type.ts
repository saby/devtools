import { SortFunction, SortResult } from "./Sort";
import { dependency, LeafType } from "../../types";

export let type: SortFunction<dependency.Item> = <T extends dependency.Item>(first: T, second: T): number => {
    if (first.type == second.type) {
        return SortResult.equal;
    }
    if (first.type == LeafType.module) {
        return SortResult.up;
    }
    return SortResult.down;
};
