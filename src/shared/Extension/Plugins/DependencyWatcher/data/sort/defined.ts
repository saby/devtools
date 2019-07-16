import { SortResult } from "./Sort";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

const defined = <T extends ModuleInfo>(first: T, secont: T): SortResult => {
    if (first.defined == secont.defined) {
        return SortResult.equal;
    }
    if (first.defined) {
        return SortResult.down;
    }
    return SortResult.up;
};

export default defined;
