import { FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";
import moduleFilters from "Extension/Plugins/DependencyWatcher/data/filter/moduleFilters";
import { IItemFilter, IItemInfo } from 'Extension/Plugins/DependencyWatcher/IItem';
import { dependentOnFile } from 'Extension/Plugins/DependencyWatcher/data/filter/dependentOnFile';


const itemFilters: Partial<Record<keyof IItemFilter, FilterFunctionGetter<any, IItemInfo>>> = {
    ...moduleFilters,
    // dependentOnFile
};

export default itemFilters;
