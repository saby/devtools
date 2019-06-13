import { PrepareFunction } from "../util/PrepareFunction";
import { ListItem } from "../../types";
import { SortFunction, SortResult } from "../sort/Sort";
// @ts-ignore
import { Order } from "Types/source";
import { isDynamic } from "../sort/isDynamic";
import { notUsed } from "../sort/notUsed";
import { name } from "../sort/name";
import { type } from "../sort/type";
import { size } from "../sort/size";

const ALL_SORTING_FUNCTIONS: Record<string, SortFunction> = {
    name,
    // @ts-ignore
    notUsed,
    isDynamic,
    // @ts-ignore
    type,
    size
};

let getDefaultSorting = <T extends ListItem>(): SortFunction<T>[] => {
    return [
        // @ts-ignore
        notUsed,
        isDynamic,
        // @ts-ignore
        type,
        name
    ]
};

let withoutOrder = <T extends ListItem>(first: T, secont: T): SortResult => {
    return SortResult.equal
};

export let wrapWithOrder = <T extends ListItem>(sort: SortFunction<T>, order: boolean | string): SortFunction<T> => {
    let k = order? 1: -1;
    return (first: T, second: T): SortResult => {
        return  sort(first, second) * k;
    }
};

let getSortFunctions = <T extends ListItem>(
    orders: Order[]
): SortFunction<T>[] => {
    if (!orders.length) {
        return getDefaultSorting();
    }
    return orders.map((order: Order) => {
        let sort = ALL_SORTING_FUNCTIONS[order.getSelector()];
        if (!sort) {
            return withoutOrder;
        }
        return wrapWithOrder(sort, order.getOrder());
    });
};

export let orderBy = <T extends ListItem>(
    orders: Order[]
): PrepareFunction<T> => {
    let sortFunctions = getSortFunctions(orders);
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
