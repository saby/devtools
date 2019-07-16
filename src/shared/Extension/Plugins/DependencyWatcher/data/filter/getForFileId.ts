import { FilterFunction, FilterFunctionGetter } from "./Filter";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

export let getForFileId: FilterFunctionGetter<number> = (fileId: number): FilterFunction<ModuleInfo> => {
    return (item: ModuleInfo) => {
        return item.fileId == fileId;
    }
};
