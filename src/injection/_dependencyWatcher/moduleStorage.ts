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

enum UpdateType {
    define,
    require,
    clear,
}
interface UpdateHandler {
    // <TArgs extends unknown[] = unknown[]>(type: UpdateType, ...args: TArgs): void;
    (type: UpdateType.require, module: string, dependencies: string[]): void;
    (type: UpdateType.define, module: string, dependencies?: string[]): void;
    (type: UpdateType.clear): void;
}

class ModuleStorage {
    private __static: Dependencies = Object.create(null);
    private __dynamic: Dependencies = Object.create(null);
    
    defineModule(module: string, dependencies?: string[]): void {
        let _dependencies = dependencies? normalizeDependencies(dependencies): [];
        this.__static[module] = _dependencies;
        this.onupdate(UpdateType.define, module, _dependencies);
    }
    addDependency(module: string, dependencies: string | string[]): void {
        let dynamic = normalizeDependencies(
            Array.isArray(dependencies)?
                dependencies:
                [dependencies]
        );
        
        let withoutStatic = filterCrossing(dynamic, this.__static[module] || []);
        let withoutExisting = filterCrossing(withoutStatic, this.__dynamic[module] || []);

        if (!withoutExisting.length) {
            return;
        }

        this.__dynamic[module] = [
            ...(this.__dynamic[module] || []),
            ...withoutExisting
        ];

        this.onupdate(UpdateType.require, module, withoutExisting);
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
        this.onupdate(UpdateType.clear);
    }
    
    private __onupdate: UpdateHandler = () => {};
    set onupdate(value) {
        if (typeof value == "function") {
            this.__onupdate = <UpdateHandler> value;
        }
    }
    get onupdate(): UpdateHandler {
        return this.__onupdate;
    }
}

let moduleStorage = new ModuleStorage();

export { moduleStorage, UpdateType }
