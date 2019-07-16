import { FilterFunction, FilterFunctionGetter } from "./Filter";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

export let getForName: FilterFunctionGetter<string> = (name: string = ''): FilterFunction<ModuleInfo> => {
    const _name = name.toLowerCase();
    return (item: ModuleInfo) => {
        return item.name.toLowerCase().includes(_name);
    }
};
