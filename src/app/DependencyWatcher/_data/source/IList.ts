import { ICompatibilityConfig } from "./Compatibility";
import { Item } from "../storage/Item";
import { IWhere, IWhereKey } from "./list/IWhere";
import { IItemFilter } from "Extension/Plugins/DependencyWatcher/IItem";
import { ILogger } from "Extension/Logger/ILogger";

export interface IgnoreFilters extends Partial<Record<IWhereKey, IWhereKey[]>> {

}

export interface DefaultFilters extends Partial<IItemFilter> {

}

export interface IListConfig extends ICompatibilityConfig {
    itemStorage: Item;
    ignoreFilters?: IgnoreFilters;
    defaultFilters?: DefaultFilters;
    logger: ILogger;
}
