import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";

export let findModule = (allModules: ModulesMap, id: string | number): Module | void => {
    for (let [ name, module ] of allModules) {
        if (module.id == id) {
            return module;
        }
    }
};
