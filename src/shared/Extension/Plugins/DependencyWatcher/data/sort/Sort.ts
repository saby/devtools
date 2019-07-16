import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

export enum SortResult {
    up = -1,
    down  = 1,
    equal = 0
}

export type SortFunction<T extends ModuleInfo = ModuleInfo> = (first: T, second: T) => SortResult;
