import { SortFunction } from "Extension/Plugins/DependencyWatcher/data/sort/Sort";
import { IModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";
import name from "./name";
import used from "./used";

const modulesSort: Record<string, SortFunction<IModuleInfo>> = {
    'name': name,
    'used': used
};

export default modulesSort;
