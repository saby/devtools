import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import moduleFilters from "Extension/Plugins/DependencyWatcher/data/filter/moduleFilters";


const itemFilters: Record<string, FilterFunctionGetter<any>> = {
    ...moduleFilters
};

export default itemFilters;
