import { SortResult } from "./Sort";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

const initialized = <T extends ModuleInfo>(first: T, secont: T): SortResult => {
    if (first.initialized == secont.initialized) {
        return SortResult.equal;
    }
    if (first.initialized) {
        return SortResult.down;
    }
    return SortResult.up;
};

export default initialized;
