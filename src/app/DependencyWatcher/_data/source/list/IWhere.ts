import { IItemFilter } from "Extension/Plugins/DependencyWatcher/IItem";

export interface IWhere extends Partial<IItemFilter> {
    parent?: string | string[];
}

export type IWhereKey = keyof IWhere;
