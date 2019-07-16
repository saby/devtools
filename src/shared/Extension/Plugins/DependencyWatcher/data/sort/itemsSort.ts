import { SortFunction } from "Extension/Plugins/DependencyWatcher/data/sort/Sort";
import fileName from "./fileName";
import size from "./size";
import modulesSort from "Extension/Plugins/DependencyWatcher/data/sort/modulesSort";
import { IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";

const itemsSort: Record<string, SortFunction<IItemInfo>> = {
    ...modulesSort,
    'size': size,
    'fileName': fileName
};

export default itemsSort;
