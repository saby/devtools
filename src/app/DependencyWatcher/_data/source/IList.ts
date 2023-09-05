import { ICompatibilityConfig } from './Compatibility';
import { Module } from '../storage/Module';
import { ILogger } from 'Extension/Logger/ILogger';
import { IRPCModuleFilter } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { DefaultFilters, IgnoreFilters } from './list/getQueryParam';

/**
 * Interface for constructors of sources of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
export interface IListConfig extends ICompatibilityConfig {
    itemStorage: Module;
    ignoreFilters?: IgnoreFilters<IRPCModuleFilter>;
    defaultFilters?: DefaultFilters<IRPCModuleFilter>;
    logger: ILogger;
}
