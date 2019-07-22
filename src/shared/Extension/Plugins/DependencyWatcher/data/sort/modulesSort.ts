import { SortFunction } from "Extension/Plugins/DependencyWatcher/data/sort/Sort";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";
import name from "./name";
import initialized from "./initialized";

const modulesSort: Record<string, SortFunction<ModuleInfo>> = {
    'name': name,
    'initialized': initialized
};

export default modulesSort;
