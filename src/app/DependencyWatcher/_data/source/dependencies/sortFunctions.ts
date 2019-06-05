import { dependency, LeafType, ListItem } from "../../types";
import { SortFunction, SortResult } from "../list/Sort";
import { forDependencyType, forName } from '../list/sortFunctions';

export let forLeafType: SortFunction<dependency.Item> = <T extends dependency.Item>(first: T, second: T): number => {
    if (first.type == second.type) {
        return SortResult.equal;
    }
    if (first.type == LeafType.module) {
        return SortResult.up;
    }
    return SortResult.down;
};


export let forUsed: SortFunction<dependency.Item> = <T extends dependency.Item>(first: T, secont: T): SortResult => {
    if (!!first.notUsed == !!secont.notUsed) {
        return SortResult.equal;
    }
    if (first.notUsed) {
        return SortResult.down;
    }
    return SortResult.up;
};

export let sortFunctions: SortFunction<dependency.Item>[] = [
    forUsed,
    forDependencyType,
    forLeafType,
    forName
];
