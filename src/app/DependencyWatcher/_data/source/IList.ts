import { ICompatibilityConfig } from "./Compatibility";
import { Module } from "../storage/Module";
import { ILogger } from "Extension/Logger/ILogger";
import { IRPCModeuleFilter, IRPCModuleInfo } from "Extension/Plugins/DependencyWatcher/IRPCModule";
import { DefaultFilters, IgnoreFilters } from "./list/getQueryParam";

export interface IListConfig extends ICompatibilityConfig {
    itemStorage: Module;
    ignoreFilters?: IgnoreFilters<IRPCModeuleFilter>;
    defaultFilters?: DefaultFilters<IRPCModeuleFilter>;
    logger: ILogger;
}
