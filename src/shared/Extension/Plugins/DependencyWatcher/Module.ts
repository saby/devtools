import { Module, TransferModule, ModulesRecord, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";

let _toArray = (set: Set<Module>): number[] => {
    return [...set].map(module => module.id)
};
export let convertToTransferModule = (
    module: Module
): TransferModule => {
    let { dependent, dependencies } = module;
    return {
        ...module,
        dependent: {
            dynamic: _toArray(dependent.dynamic),
            static: _toArray(dependent.static),
        },
        dependencies: {
            dynamic: _toArray(dependencies.dynamic),
            static: _toArray(dependencies.static),
        }
    }
};
export let convertToRecord = (map: ModulesMap): ModulesRecord<TransferModule> => {
    let record: ModulesRecord<TransferModule> = Object.create(null);
    map.forEach((module: Module, name: string) => {
        record[name] = convertToTransferModule(module);
    });
    return record;
};

/*

let _toSet = (array: number[], record: ): Set<Module> => {

};
export let getModule = (
    name: string,
    modules: ModulesRecord<TransferModule>,
    modulesArray?: TransferModule[]
): Module | void => {
    let module = modules[name];
    if (!module) {
        return ;
    }
    let modulesArr = modulesArray || Object.values(modules);
    return {
      ...module,
        dependent: {
            dynamic: new Set([module.dependent.dynamic.map(id => module.id)),
            static: [...dependent.static].map(module => module.id),
        },
        dependencies: {
            dynamic: [...dependencies.dynamic].map(module => module.id),
            static: [...dependencies.static].map(module => module.id),
        },
    }
};
export let convertToMap = (record: ModulesRecord): ModulesMap => {
    return new Map(Object.entries(record).map(([name, module]: [string, TransferModule]) => {
        return [name, getModule(name, module)];
    }));
};
*/
