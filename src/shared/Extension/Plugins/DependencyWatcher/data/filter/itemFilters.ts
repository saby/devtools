import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import moduleFilters from "Extension/Plugins/DependencyWatcher/data/filter/moduleFilters";
import { IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";


const itemFilters: Record<string, FilterFunctionGetter<any, IItemInfo>> = {
    ...moduleFilters
};

export default itemFilters;
