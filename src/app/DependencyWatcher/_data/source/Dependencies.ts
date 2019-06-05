import { DependencyType, GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { deserialize, serialize } from "./util/id";
// @ts-ignore
import { Query } from 'Types/source';
import { dependency, LeafType } from "../types";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { findFile } from "./util/findFile";
import { SortFunction } from "./list/Sort";
import { sortFunctions } from "./dependencies/sortFunctions";
import { IModuleDependency, ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";

let hasChild = (module?: TransferModule): boolean => {
    if (!module) {
        return false;
    }
    return (module.dependencies.dynamic && module.dependencies.dynamic.length > 0) ||
        (module.dependencies.static && module.dependencies.static.length > 0);
};

let createItem = (
    name: string,
    type: LeafType,
    parent: string | undefined,
    child: boolean,
    isDynamic?: boolean
): dependency.Item => {
    
    return {
        name,
        id: serialize(name, type),
        parent,
        child: child || null,
        type: type,
        isDynamic,
    }
};

let createFile = (
    name: string,
    parent: string | undefined,
    isDynamic?: boolean
): dependency.ItemFile => {
    let file = <dependency.ItemFile> createItem(name, LeafType.file, parent, true, isDynamic);
    return {
        ...file
    }
};
let createModule = (
    name: string,
    parent: string | undefined,
    child: boolean,
    isDynamic: boolean = false,
    notUsed: boolean = false
): dependency.ItemModule => {
    let module = <dependency.ItemModule> createItem(name, LeafType.module, parent, child, isDynamic);
    return {
        ...module,
        notUsed
    }
};

let getFileName = (
    bundles: Bundles,
    moduleName: string,
    parent?: string
) => {
    let fileName = findFile(bundles, moduleName);
    if (!fileName) {
        return '';
    }
    if (!parent) {
        return fileName;
    }
    let [ parentName ] = deserialize(parent);
    // нет смысла показывать бандл, если модуль расположен в одном бандле с родителем
    return fileName !== findFile(bundles, parentName)? fileName: '';
};

let eachDependencies = (
    modules: ModulesRecord<TransferModule>,
    module: TransferModule,
    callback: (type: DependencyType, moduleName: string) => void
) => {
    for (let type in module.dependencies) {
        let dependencies = Object.values(modules).filter((dependency: TransferModule) => {
            return module.dependencies[<DependencyType>type].includes(dependency.id);
        }).map(module => module.name);
        let cb = callback.bind(null, <DependencyType> type);
        dependencies.forEach(cb);
    }
};

export class Dependencies<
    TFilter extends dependency.IFilterData = dependency.IFilterData
> extends Abstract<dependency.Item, TFilter> {
    private readonly _fileModuleUsing: Map<string, Set<string>> = new Map();
    // @ts-ignore
    protected _sortFunctions: SortFunction<dependency.Item>[] = sortFunctions;
    protected _query(query: Query): Promise<dependency.Item[]> {
        // console.log('Dependencies => _query:', query);
        // @ts-ignore
        const { parent } = <TFilter> query.getWhere();
    
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
        ]).then(([bundle, modules]) => {
            return bundle.map((moduleName) => {
                let subDependencies = modules[moduleName];
                return createModule(
                    moduleName,
                    id,
                    hasChild(subDependencies),
                    false,
                    !this.__isUsingInFile(id, moduleName)
                );
            });
        });
    }
    
    private __queryModule(module: string, id?: string): Promise<dependency.Item[]> {
        return this._getModules().then((modules: ModulesRecord<TransferModule>) => {
            let dependencies = modules[module];
            if (!dependencies) {
                return [];
            }
            return this.__mapDependencies(modules, dependencies, id);
        });
    }
    
    /**
     *
     * @param modules
     * @param dependencies
     * @param id
     * @private
     */
    private __mapDependencies(
        modules: ModulesRecord<TransferModule>,
        dependencies: TransferModule,
        id?: string
    ): Promise<dependency.Item[]> {
        return this._getBundles().then((bundles) => {
            let items: dependency.Item[] = [];
            let files: Map<string, dependency.ItemFile> = new Map();
            eachDependencies(modules, dependencies, (type, moduleName) => {
                let fileName = getFileName(bundles, moduleName, id);
                let isDynamic = type === DependencyType.dynamic;
                if (!fileName) {
                    let subDependencies = modules[moduleName];
                    items.push(
                        createModule(
                            moduleName,
                            id,
                            hasChild(subDependencies),
                            isDynamic
                        )
                    );
                    return;
                }
                this.__addFile(files, fileName, moduleName, isDynamic, id);
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
