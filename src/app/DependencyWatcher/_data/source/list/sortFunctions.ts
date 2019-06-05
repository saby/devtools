import { ListItem } from "../../types";
import { SortFunction, SortResult } from "./Sort";

export let forName: SortFunction<ListItem> = <T extends ListItem>(first: T, secont: T): SortResult => {
    return SortResult.equal
};

export let forDependencyType: SortFunction<ListItem> = <T extends ListItem>(first: T, secont: T): SortResult => {
    if (first.isDynamic == secont.isDynamic) {
        return SortResult.equal;
    }
    if (first.isDynamic) {
        return SortResult.down;
    }
    return SortResult.up;
};


export let sortFunctions: SortFunction<ListItem>[] = [
    forDependencyType,
    forName
];
