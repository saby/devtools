import { SortFunction } from "Extension/Plugins/DependencyWatcher/data/sort/Sort";
import fileName from "./fileName";
import modulesSort from "Extension/Plugins/DependencyWatcher/data/sort/modulesSort";
import { IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";
import filesSort from "Extension/Plugins/DependencyWatcher/data/sort/filesSort";

const itemsSort: Record<string, SortFunction<IItemInfo>> = {
    ...modulesSort,
    ...filesSort,
    'fileName': fileName
};

export default itemsSort;
