import { IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";

export interface IListItem extends IItemInfo {
    id: string;
    parent?: string;
    isDynamic?: boolean;
    child: boolean | null;
    itemId: number;
}
