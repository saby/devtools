import { SortFunction, SortResult } from "./Sort";
import { IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";

const fileName: SortFunction<IItemInfo> = <T extends IItemInfo>(firstItem: T, secondItem: T): SortResult => {
    const first: string = firstItem.fileName || '';
    const second: string = secondItem.fileName || '';
    return first.localeCompare(
        second,
        undefined,
        { sensitivity: 'base' }
    );
};

export default fileName;
