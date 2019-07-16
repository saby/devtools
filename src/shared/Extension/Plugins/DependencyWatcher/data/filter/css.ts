import { FilterFunction } from "./Filter";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

export let css: FilterFunction<ModuleInfo> = <T extends ModuleInfo>(item: T): boolean => {
    return !item.name.startsWith('css!');
};
