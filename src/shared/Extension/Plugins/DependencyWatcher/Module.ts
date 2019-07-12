import {
    Module,
    TransferModule,
    ModulesRecord,
    ModulesMap
} from "Extension/Plugins/DependencyWatcher/IModule";


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

let _toSet = (
    array: number[],
    transferMap: ModulesMap,
    idMap: Map<number, string>
): Set<Module> => {
    return new Set(array.map((id: number) => {
        return <Module> transferMap.get(<string> idMap.get(id));
    }));
};

export let convertToMap = (
    record: ModulesRecord<TransferModule>
): ModulesMap => {
    let map: ModulesMap = new Map();
    
    let transferMap: ModulesMap<TransferModule> = new Map(Object.entries(record));
    
    // карта id-name для быстрого доступа к модулю по id во время преобразования id[] к Set<Module>
    let idMap: Map<number, string> = new Map();

    // преобразование TransferModule к Module
    transferMap.forEach((transferModule: TransferModule, name: string) => {
        idMap.set(transferModule.id, name);
        map.set(name, {
            ...transferModule,
            dependent: {
                dynamic: new Set(),
                static: new Set(),
            },
            dependencies:  {
                dynamic: new Set(),
                static: new Set(),
            }
        });
    });

    // проставление зависимостей в Module из TransferModule
    transferMap.forEach((transferModule: TransferModule) => {
        let module = <Module> map.get(transferModule.name);
        let { dependent, dependencies } = transferModule;
        
        module.dependent.static = _toSet(dependent.static, map, idMap);
        module.dependent.dynamic = _toSet(dependent.dynamic, map, idMap);
        module.dependencies.static = _toSet(dependencies.static, map, idMap);
        module.dependencies.dynamic = _toSet(dependencies.dynamic, map, idMap);
    });
    return map;
};
