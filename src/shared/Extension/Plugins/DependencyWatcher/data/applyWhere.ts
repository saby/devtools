import { FilterFunction, FilterFunctionGetter } from "./filter/Filter";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

const getFilterFunctions = <
    TItem extends ModuleInfo,
    TFilter
>(
    where: TFilter,
    filterFunctionGetters: Record<string, FilterFunctionGetter<any>>
): FilterFunction<TItem>[] => {
    const filterFunctions: FilterFunction<TItem>[] = [];
    for (const filterName in where) {
        if (filterFunctionGetters.hasOwnProperty(filterName)) {
            filterFunctions.push(filterFunctionGetters[filterName](where[filterName]));
        }
    }
    return filterFunctions;
};


const applyWhere = <TItem extends ModuleInfo, TFilter> (
    items: TItem[],
    where: TFilter,
    filterFunctionGetters: Record<string, FilterFunctionGetter<any>>
) => {
    let filterFunctions: FilterFunction[] = getFilterFunctions(where, filterFunctionGetters);
    return items.filter((item: TItem) => {
        return filterFunctions.every((filter: FilterFunction) => {
            return filter(item);
        });
    });
};

export default applyWhere;
