import { SortFunction, SortResult } from "./Sort";
import { IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";

const size: SortFunction<IItemInfo> = <T extends IItemInfo>(first: T, second: T): SortResult => {
    let _first: number = first.size || 0;
    let _second: number = second.size || 0;

    return _first - _second;
};

export default size;
