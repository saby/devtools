import { Method } from "Extension/Event/RPC";
import { moduleStorage } from "../moduleStorage";
import { Dependencies, DependencyType } from "Extension/Plugins/DependencyWatcher/const";

export let getModules: Method<Record<DependencyType, Dependencies>> = () => {
    let modules = moduleStorage.getAll();
    // moduleStorage.clear();
    return modules;
};
