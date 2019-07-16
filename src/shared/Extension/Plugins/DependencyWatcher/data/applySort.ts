import { SortFunction, SortResult } from "./sort/Sort";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";
import { SortBy } from "./IQuery";

const isEmpty = <T extends object>(obj: T): boolean => {
    return !Object.keys(obj).length;
};

let wrapWithOrder = <T extends ModuleInfo>(sort: SortFunction<T>, order: boolean): SortFunction<T> => {
    let k = order? 1: -1;
    return (first: T, second: T): SortResult => {
        return sort(first, second) * k;
    }
};

let getSortFunctions = <TItem extends ModuleInfo>(
    sortBy: SortBy<TItem>,
    sortFunctions: Record<string, SortFunction<TItem>>
): SortFunction<TItem>[] => {
    const result: SortFunction<TItem>[] = [];
    for (const sortField in sortBy) {
        if (sortBy.hasOwnProperty(sortField) &&
            sortFunctions.hasOwnProperty(sortField)
        ) {
            result.push(wrapWithOrder(
                sortFunctions[sortField],
                <boolean> sortBy[sortField]
            ));
        }
    }
    return result;
};

const applySort = <TItem extends ModuleInfo>(
    items: TItem[],
    sortBy: SortBy<TItem>,
    allSortFunctions: Record<string, SortFunction<TItem>>
): TItem[] => {
    if (isEmpty(sortBy)) {
        return items;
    }
    const sortFunctions = getSortFunctions(sortBy, allSortFunctions);
    if (!sortFunctions.length) {
        return items;
    }
    return items.sort((first: TItem, second: TItem) => {
        for (let sortFunction of sortFunctions) {
            let priority = sortFunction(first, second);
            if (priority) {
                return priority;
            }
        }
        return SortResult.equal
    });
};

export default applySort;
