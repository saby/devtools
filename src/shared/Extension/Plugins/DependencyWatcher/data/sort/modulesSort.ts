import { SortFunction } from "Extension/Plugins/DependencyWatcher/data/sort/Sort";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";
import name from "./name";
import defined from "./defined";

const modulesSort: Record<string, SortFunction<ModuleInfo>> = {
    'name': name,
    'defined': defined
};

export default modulesSort;
