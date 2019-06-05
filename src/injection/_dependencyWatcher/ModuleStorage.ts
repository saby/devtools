import { DependencyType, TYPESCRIPT_HELPERS_MODULE, } from "Extension/Plugins/DependencyWatcher/const";
import {
    Module,
    ModulesMap
} from "Extension/Plugins/DependencyWatcher/IModule";
import { ignoredPlugin, IRequirePlugin } from "./require/plugins";

let filterHelpers = (module: string): boolean => {
    return !TYPESCRIPT_HELPERS_MODULE.includes(module);
};
let mapIgnoredPlugins = (module: string): string => {
  ignoredPlugin.forEach((plugin: IRequirePlugin) => {
      module = plugin(module);
  });
  return module;
};

let getId = (() => {
    let id: number = 0;
    return (): number => {
        id++;
        return id;
    }
})();

export enum UpdateType {
    define,
    require,
    clear,
}

interface UpdateHandler {
    // <TArgs extends unknown[] = unknown[]>(type: UpdateType, ...args: TArgs): void;
    (updateType: UpdateType.require, module: string, dependencies: string[], type: DependencyType): void;
    (updateType: UpdateType.define, module: string): void;
    (updateType: UpdateType.clear): void;
}

export class ModuleStorage {
    constructor(private __onupdate: UpdateHandler = (() => {})) {
    
    }
    private readonly __allModules: ModulesMap = new Map();
    private readonly __newModules: Set<string> = new Set();

    define(name: string, dependencies?: string[]): void {
        let module = this.__get(name);
        this.__addDeps(module, dependencies || [], DependencyType.static);
    }

    require(name: string, dependencies: string | string[], type: DependencyType = DependencyType.dynamic) {
        let module = this.__get(name);
        this.__addDeps(
            module,
            Array.isArray(dependencies)?
                dependencies:
                [dependencies],
            type);
    }

    getModule(name: string): Module | void  {
        return this.__allModules.get(name);
    }

    getModules(dependencies?: string[]): ModulesMap {
        if (!dependencies || !dependencies.length) {
            this.__newModules.clear();
            return this.__allModules;
        }
        let map: ModulesMap = new Map();
        dependencies.forEach((dependency: string) => {
            let module = this.__allModules.get(dependency);
            this.__newModules.delete(dependency);
            if (module) {
                map.set(dependency, module);
            }
        });
        return  map;
    }
    getNewModules(): string[] {
        return  [...this.__newModules];
    }
    
    private __get(name: string): Module {
        this.__newModules.add(name);
        let module = this.__allModules.get(name);
        if (module) {
            return module;
        }
        module = {
            name,
            id: getId(),
            dependencies: {
                static: new Set(),
                dynamic: new Set()
            },
            dependent: {
                static: new Set(),
                dynamic: new Set()
            }
        };
        this.__allModules.set(name, module);
        return  module;
    }

    private __addDeps(module: Module, dependencies: string[], type: DependencyType) {
        let _dependencies = dependencies.
            filter(filterHelpers).
            filter(dependency => !!dependency).
            map(mapIgnoredPlugins).
            map((dependency: string): Module => {
                return  this.__get(dependency);
            });

        if (!_dependencies.length) {
            return;
        }

        let newDeps: Module[];
        if (type == DependencyType.dynamic) {
            newDeps = this.__addDynamic(module, _dependencies);
        } else {
            newDeps =  this.__addStatic(module, _dependencies);
        }
        if (newDeps.length) {
            this.__onupdate(
                UpdateType.require,
                module.name,
                newDeps.map(module => module.name),
                type
            );
        }
    }

    private __addStatic(module: Module, dependencies: Module[]): Module[] {
        let withoutExisting = dependencies.filter((dependency: Module) => {
            return !module.dependencies.static.has(dependency);
        });
        withoutExisting.forEach((dependency: Module) => {
            module.dependencies.static.add(dependency);
            dependency.dependent.static.add(module);
        });
        return withoutExisting;
    }

    private __addDynamic(module: Module, dependencies: Module[]): Module[] {
        let withoutStatic = dependencies.filter((dependency: Module) => {
           return !module.dependencies.static.has(dependency);
        });

        let withoutExisting = withoutStatic.filter((dependency: Module) => {
            return !module.dependencies.dynamic.has(dependency);
        });
    
        withoutStatic.forEach((dependency: Module) => {
            module.dependencies.dynamic.add(dependency);
            dependency.dependent.dynamic.add(module);
        });

        return withoutExisting;
    }
}
