import { FilterFunction, FilterFunctionGetter } from "./filter/Filter";

const getFilterFunctions = <
    TItem,
    TFilter
>(
    where: TFilter,
    filterFunctionGetters: Record<string, FilterFunctionGetter<any, TItem>>
): FilterFunction<TItem>[] => {
    const filterFunctions: FilterFunction<TItem>[] = [];
    for (const filterName in where) {
        if (filterFunctionGetters.hasOwnProperty(filterName)) {
            filterFunctions.push(filterFunctionGetters[filterName](where[filterName]));
        }
    }
    return filterFunctions;
};


const applyWhere = <TItem, TFilter> (
    items: TItem[],
    where: TFilter,
    filterFunctionGetters: Record<string, FilterFunctionGetter<any, TItem>>
) => {
    let filterFunctions: FilterFunction<TItem>[] = getFilterFunctions(where, filterFunctionGetters);
    return items.filter((item: TItem) => {
        return filterFunctions.every((filter: FilterFunction<TItem>) => {
            return filter(item);
        });
    });
};

export default applyWhere;
