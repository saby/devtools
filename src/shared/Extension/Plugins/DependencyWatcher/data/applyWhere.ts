import { FilterFunction, FilterFunctionGetter } from "./filter/Filter";

const getFilterFunctions = <
    TItem,
    TFilter extends object
>(
    where: TFilter,
    filterFunctionGetters: Partial<Record<keyof TFilter, FilterFunctionGetter<any, TItem>>>
): FilterFunction<TItem>[] => {
    const filterFunctions: FilterFunction<TItem>[] = [];
    for (const filterName in where) {
        const filterGetter = filterFunctionGetters[filterName];
        if (!filterGetter) {
            continue;
        }
        filterFunctions.push(filterGetter(where[filterName]));
    }
    return filterFunctions;
};


const applyWhere = <TItem, TFilter extends object> (
    items: TItem[],
    where: TFilter,
    filterFunctionGetters: Partial<Record<keyof TFilter, FilterFunctionGetter<any, TItem>>>
) => {
    let filterFunctions: FilterFunction<TItem>[] = getFilterFunctions(where, filterFunctionGetters);
    return items.filter((item: TItem) => {
        return filterFunctions.every((filter: FilterFunction<TItem>) => {
            return filter(item);
        });
    });
};

export default applyWhere;
