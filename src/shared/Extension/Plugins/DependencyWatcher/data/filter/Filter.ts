import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

export type FilterFunction<T extends ModuleInfo = ModuleInfo> = (item: T) => boolean;

export type FilterFunctionGetter<
    TFilterData,
    TItem extends ModuleInfo = ModuleInfo,
> = (filter: TFilterData) => FilterFunction<TItem>;
