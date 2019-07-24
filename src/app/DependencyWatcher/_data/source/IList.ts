import { ICompatibilityConfig } from "./Compatibility";
import { Item } from "../storage/Item";
import { ILogger } from "Extension/Logger/ILogger";
import { IItemFilter, IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";
import { DefaultFilters, IgnoreFilters } from "./list/getQueryParam";

export interface IListConfig extends ICompatibilityConfig {
    itemStorage: Item;
    ignoreFilters?: IgnoreFilters<IItemFilter>;
    defaultFilters?: DefaultFilters<IItemFilter>;
    logger: ILogger;
}
