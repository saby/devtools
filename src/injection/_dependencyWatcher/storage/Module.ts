import { Storage } from "./Storage";
import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";
import {
    DependencyType,
    GLOBAL_MODULE_NAME,
    TYPESCRIPT_HELPERS_MODULE,
} from "Extension/Plugins/DependencyWatcher/const";
import { ignoredPlugins, IRequirePlugin } from "../require/plugins";
import { getId } from "./getId";

let filterHelpers = (module: string): boolean => {
    return !TYPESCRIPT_HELPERS_MODULE.includes(module);
};
let mapIgnoredPlugins = (module: string): string => {
    ignoredPlugins.forEach((plugin: IRequirePlugin) => {
        module = plugin(module);
    });
    return module;
};

interface UpdateHandler {
    (moduleId: number): void;
}

const addDynamic = (module: Module, dependencies: Module[]): Module[] => {
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
};
const addStatic = (module: Module, dependencies: Module[]): Module[] => {
    let withoutExisting = dependencies.filter((dependency: Module) => {
        return !module.dependencies.static.has(dependency);
    });
    withoutExisting.forEach((dependency: Module) => {
        module.dependencies.static.add(dependency);
        dependency.dependent.static.add(module);
    });
    return withoutExisting;
};

export class ModuleStorage extends Storage<Module> {
    constructor(private __onupdate: UpdateHandler = (() => {})) {
        super();
    }
    private readonly __updates: Set<number> = new Set();
    private __modulesReaded: boolean = false;

    define(name: string, dependencies: string[], moduleData: unknown): void {
        let module = this.__get(name);
        if (typeof moduleData !== 'function') {
            module.defined = true;
        }
        this.__addDeps(module, dependencies, DependencyType.static);
    }
    initModule(name: string): void {
        let module = this.__get(name);
        module.defined = true;
        if (this.__modulesReaded) {
            this.__updates.add(module.id);
            this.__onupdate(module.id);
        }
    }

    require(name: string, dependencies: string | string[], type: DependencyType = DependencyType.dynamic) {
        let module = this.__get(name);
        this.__addDeps(
            module,
            Array.isArray(dependencies)?
                dependencies:
                [dependencies],
            type
        );
    }

    getModules(keys?: number[]): ModulesMap {
        this.__modulesReaded = true;
        if (!keys || !keys.length) {
            this.__updates.clear();
            return this._nameMap;
        }
        let map: ModulesMap = new Map();
        this.getItemsById(keys).forEach((module: Module) => {
            map.set(module.name, module);
            this.__updates.delete(module.id);
        });
        return  map;
    }
    getUpdates(): number[] {
        return [...this.__updates]
    }

    private __get(name: string): Module {
        return super.getItemByName(name) ||
            this.__create(name);
    }

    private __create(name: string): Module {
        const module: Module = {
            name,
            defined: false,
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
        if (name == GLOBAL_MODULE_NAME) {
            module.defined = true;
        }
        super.add(module);
        return module;
    }

    private __addDeps(module: Module, dependencies: string[], type: DependencyType) {
        const _dependencies = dependencies.
        filter(filterHelpers).
        filter(dependency => !!dependency).
        map(mapIgnoredPlugins).
        map((dependency: string): Module => {
            return this.__get(dependency);
        });

        if (!_dependencies.length) {
            return;
        }
        let updates;
        if (type == DependencyType.dynamic) {
            updates = addDynamic(module, _dependencies);
        } else {
            updates = addStatic(module, _dependencies);
        }
        /*
         * Кидаем собыетие об обновлении только после того как модули будут хоть раз вычитаны
         * Нет смысла забивать канал сообщениями, если вкладка не открыта
         */
        if (this.__modulesReaded && updates.length) {
            this.__updates.add(module.id);
            updates.forEach(({ id }: Module) => {
                this.__updates.add(id);
            });
            this.__onupdate(module.id);
        }
    }
}
