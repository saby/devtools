import { GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { deserialize, serialize } from "./util/id";
import { dependency, LeafType } from "../types";
import { SortFunction } from "./list/Sort";
import { sortFunctions } from "./dependencies/sortFunctions";
import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";

let hasChild = (module?: Module): boolean => {
    if (!module) {
        return false;
    }
    return (module.dependencies.dynamic && module.dependencies.dynamic.size > 0) ||
        (module.dependencies.static && module.dependencies.static.size > 0);
};

let getItem = (
    module: Module,
    parent: string | undefined,
    isDynamic: boolean = false,
    notUsed: boolean = false
): dependency.ItemModule => {
    let { bundle, fileName, size, name} = module;
    return {
        bundle, fileName, size, name,
        id: serialize(name, LeafType.module),
        parent,
        child: hasChild(module) || null,
        type: LeafType.module,
        isDynamic,
        notUsed
    }
};

let createFile = (
    name: string,
    parent: string | undefined,
    isDynamic?: boolean
): dependency.ItemFile => {
    return {
        name,
        id: serialize(name, LeafType.file),
        parent,
        child: true,
        type: LeafType.file,
        isDynamic,
    }
};

export class Dependencies<
    TFilter extends dependency.IFilterData = dependency.IFilterData
> extends Abstract<dependency.Item, TFilter> {
    private readonly _fileModuleUsing: Map<string, Set<string>> = new Map();
    // @ts-ignore
    protected _sortFunctions: SortFunction<dependency.Item>[] = sortFunctions;
    protected _query(where: TFilter): Promise<dependency.Item[]> {
        // console.log('Dependencies => _query:', query);
        const { parent } = where;
    
        if (!parent) {
            return  this.__queryModule(GLOBAL_MODULE_NAME);
        }
        
        let [ module, type ] = <[string, LeafType]> deserialize(parent);
    
        if (type == LeafType.file) {
            return this.__queryFile(module, parent);
        }
    
        return  this.__queryModule(module, parent);
    }
    
    /**
     * Получение модулей в бандле
     * @param {string} fileName - имя бандла
     * @param {string} id - полный id родительского узла (файла)
     */
    private __queryFile(fileName: string, id: string): Promise<dependency.Item[]> {
        // console.log('Dependencies => _queryFile:', fileName);
        return Promise.all([
            this.__getBundleModules(fileName),
            this._getModules()
        ]).then(([bundle, allModules]: [string[], ModulesMap]) => {
            return bundle.filter((moduleName: string) => {
                return allModules.has(moduleName);
            }).map((moduleName: string) => {
                return getItem( <Module> allModules.get(moduleName), id, false, !this.__isUsingInFile(id, moduleName));
            });
        });
    }
    
    private __queryModule(moduleName: string, parentId?: string): Promise<dependency.Item[]> {
        return this._getModules().then((allModule: ModulesMap) => {
            let module = allModule.get(moduleName);
            if (!module) {
                return [];
            }
            return this.__mapDependencies(module, parentId);
        });
    }
    
    /**
     *
     * @param module
     * @param parentId
     * @private
     */
    private __mapDependencies(
        module: Module,
        parentId?: string
    ): Promise<dependency.Item[]> {
        return Promise.resolve().then(() => {
            let items: dependency.Item[] = [];
            let files: Map<string, dependency.ItemFile> = new Map();
            module.dependencies.dynamic.forEach((subModule: Module) => {
                if (subModule.bundle && module.bundle != subModule.bundle) {
                    this.__addFile(files, subModule.bundle, subModule.name, true, parentId);
                    return;
                }
                items.push(getItem(subModule, parentId, true));
            });
            module.dependencies.static.forEach((subModule: Module) => {
                if (subModule.bundle && module.bundle != subModule.bundle) {
                    this.__addFile(files, subModule.bundle, subModule.name, false, parentId);
                    return;
                }
                items.push(getItem(subModule, parentId, false));
            });
    
            files.forEach((file) => {
                items.push(file);
            });
            return items;
        });
    }
    
    private __addFile(
        files: Map<string, dependency.ItemFile>,
        fileName: string,
        moduleName: string,
        isDynamic: boolean,
        id?: string,
    ) {
        let file = <dependency.ItemFile> files.get(fileName) || createFile(
            fileName,
            id,
            isDynamic
        );

        // файл является динамической зависимостью только тогда, когда все модули от которых мы зависим в нём тоже динамические
        if (!isDynamic && file.isDynamic) {
            file.isDynamic = false;
        }

        this.__addUsingFile(file.id, moduleName);

        files.set(fileName, file);
    }

    private __addUsingFile(fileId: string, moduleName: string) {
        let set = this._fileModuleUsing.get(fileId) || new Set();
        set.add(moduleName);
        this._fileModuleUsing.set(fileId, set);
    }
    private __isUsingInFile(fileId: string, moduleName: string) {
        let fileModuleUsing = this._fileModuleUsing.get(fileId);
        if (!fileModuleUsing) {
            // когда в кэше почему-то нету данных какие модули из файла используются на конкретном уровне
            // возвращаемся чтобы не помечть модули неиспользуемыми
            return true;
        }
        return fileModuleUsing.has(moduleName);
    }

    private __getBundleModules(fileName: string): Promise<string[]> {
        return this._getBundles().then((bundles) => {
            return bundles[fileName];
        })
    }
}
