import { Method } from "Extension/Event/RPC";
import { moduleStorage } from "../moduleStorage";
import { DependencyType } from "Extension/Plugins/DependencyWatcher/const";

export let getModulesList: Method<Array<string>> = () => {
    return [...new Set([
        ...Object.keys(moduleStorage.get(DependencyType.static)),
        ...Object.keys(moduleStorage.get(DependencyType.dynamic))
    ])];
};
