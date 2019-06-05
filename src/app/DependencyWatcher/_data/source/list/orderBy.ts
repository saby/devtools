import { PrepareFunction } from "../util/PrepareFunction";
import { ListItem } from "../../types";
import { SortFunction, SortResult } from "./Sort";

export let orderBy = <T extends ListItem>(
    orderBy: unknown[],
    sortFunctions: SortFunction<T>[]
): PrepareFunction<T> => {
    return (set: T[]) => {
        return set.sort((first, second) => {
            for (let sortFunction of sortFunctions) {
                let priority = sortFunction(first, second);
                if (priority) {
                    return priority;
                }
            }
            return SortResult.equal
        });
    }
};
