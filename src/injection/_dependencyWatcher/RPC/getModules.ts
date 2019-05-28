import { Method } from "Extension/Event/RPC";
import { moduleStorage } from "../moduleStorage";
import { DependencyType } from "Extension/Plugins/DependencyWatcher/const";
import { Dependencies } from "Extension/Plugins/DependencyWatcher/Module";

export let getModules: Method<Record<DependencyType, Dependencies>> = () => {
    // let modules = moduleStorage.getAll();
    // moduleStorage.clear();
    // return modules
    return moduleStorage.getAll();
};
