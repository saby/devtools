import {
    IGNORE_PREFIX,
    DependencyType,
    TYPESCRIPT_HELPERS_MODULE,
} from "Extension/Plugins/DependencyWatcher/const";
import { Dependencies, DependenciesRecord } from "Extension/Plugins/DependencyWatcher/Module";

let removePrefix = (module: string): string => {
    let newName: string = module;
    for (let prefix of IGNORE_PREFIX) {
        newName = newName.replace(prefix, '');
    }
    return newName;
};

let filterCrossing = (target: string[], crossing: string[]) => {
    return target.filter((module) => {
        return !crossing.includes(module);
    })
};

let filterHelpers = (modules: string[]): string[] => {
    return filterCrossing(modules, TYPESCRIPT_HELPERS_MODULE);
};

let normalizeDependencies = (dependencies: string[]): string[] => {
  return filterHelpers(dependencies).map(removePrefix);
};

let getUniques = (modules: string[]): string[] => {
    return [...new Set(modules)]
};

class ModuleStorage {
    private __static: Dependencies = Object.create(null);
    private __dynamic: Dependencies = Object.create(null);
    
    defineModule(module: string, dependencies?: string[]): void {
        this.__static[module] = dependencies? normalizeDependencies(dependencies): [];
    }
    addDependency(module: string, dependencies: string | string[]): void {
        let dynamic = normalizeDependencies(
            Array.isArray(dependencies)?
                dependencies:
                [dependencies]
        );

        this.__dynamic[module] = getUniques([
            ...filterCrossing(dynamic, this.__static[module] || []),
            ...(this.__dynamic[module] || [])
        ]);
    }
    get(type: DependencyType): Dependencies  {
        switch (type) {
            case DependencyType.dynamic: {
                return this.__dynamic;
            }
            case DependencyType.static: {
                return this.__static
            }
        }
    }
    getAll(): DependenciesRecord {
        return {
            [DependencyType.static]: this.__static,
            [DependencyType.dynamic]: this.__dynamic,
        }
    }
    clear() {
        this.__static = Object.create(null);
        this.__dynamic = Object.create(null);
    }
    
}

let moduleStorage = new ModuleStorage();

export { moduleStorage }
