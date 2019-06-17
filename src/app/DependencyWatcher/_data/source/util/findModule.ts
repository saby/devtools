import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";

export let findModule = (allModules: ModulesMap, id: string | number): Module | undefined => {
    // todo до дех пор, пока TS не научится нормально компилировать for of Map в es5, либо билдер не науится чобирать в es6+
    // for (let [ name, module ] of allModules) {
    //     if (module.id == id) {
    //         return module;
    //     }
    // }
    let module: Module;
    allModules.forEach((m) => {
        if (module) {
            return;
        }
        if (m.id == id) {
            module = m;
        }
    });
    // @ts-ignore
    return module;
};
