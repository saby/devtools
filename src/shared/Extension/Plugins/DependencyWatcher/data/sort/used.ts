import { SortResult } from "./Sort";
import { IModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

const used = <T extends IModuleInfo>(first: T, secont: T): SortResult => {
    if (first.initialized == secont.initialized) {
        if (first.defined == secont.defined) {
            return SortResult.equal;
        }
        if (first.defined) {
            return SortResult.up;
        }
        return SortResult.down;
    }
    if (first.initialized) {
        return SortResult.down;
    }
    return SortResult.up;
};

export default used;
