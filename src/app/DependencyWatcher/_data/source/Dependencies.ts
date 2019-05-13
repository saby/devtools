// @ts-ignore
import { IModuleDependency, IModulesDependencyMap } from "Extension/Plugins/DependencyWatcher/Module";
import { IDependencyTreeData, IFilterData, ListItemFile } from "../../interface/View";
import { DependencyType, GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { deserialize, serialize } from "../util/id";
import { IQuery } from "./IQuery";
import { LeafType } from "../../const";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { findFile } from "../util/findFile";

let hasChild = (dependencies?: IModuleDependency): boolean => {
    if (!dependencies) {
        return false;
    }
    return (dependencies.dynamic && dependencies.dynamic.length > 0) ||
        (dependencies.static && dependencies.static.length > 0);
};


let getModuleDependencies = (data: IModulesDependencyMap, name: string) => {
    return data.get(name);
};

let createItem = (
    name: string,
    type: LeafType,
    isDynamic: boolean,
    parent: string,
    child: boolean,
    properties?: object
): IDependencyTreeData => {
    return {
        name,
        id: serialize(name, type),
        isDynamic,
        parent: parent === GLOBAL_MODULE_NAME? undefined: parent,
        child: child || null,
        type,
        ...properties
    }
};

/**
 * Получение модулей в бандле
 * @param data - мап всех модулей
 * @param bundles - объект с информацией по всем бандлам
 * @param file - имя бандла
 * @param parentId - id родительского узла
 */
let getForFile = <T>(
    data: IModulesDependencyMap,
    bundles: Bundles,
    file: string,
    parentId: string
): IDependencyTreeData[] => {
    let bundle = bundles[file];
    if (!bundle) {
        return [];
    }
    return bundles[file].map((moduleName) => {
        let subDependencies = data.get(moduleName);
        return createItem(moduleName, LeafType.module, false, parentId, hasChild(subDependencies))
    });
};

let getFileName = (
    bundles: Bundles,
    moduleName: string,
    parent: string
) => {
    let fileName = findFile(bundles, moduleName);
    if (!fileName) {
        return '';
    }
    let [ parentName ] = deserialize(parent);
    // нет смысла показывать бандл, если модуль расположен в одном бандле с родителем
    return fileName !== findFile(bundles, parentName)? fileName: '';
};

let prepareDependencies = (
    data: IModulesDependencyMap,
    bundles: Bundles,
    parent: string,
    dependencies?: IModuleDependency
): IDependencyTreeData[] => {
    if (!dependencies) {
        return [];
    }
    let result: IDependencyTreeData[] = [];
    let files: Map<string, ListItemFile> = new Map();
    for (let type in dependencies) {
        let dependency = dependencies[<DependencyType> type];
        dependency.forEach((moduleName) => {
            let fileName = getFileName(bundles, moduleName, parent);
            if (!fileName) {
                let subDependencies = data.get(moduleName);
                result.push(
                    createItem(
                        moduleName,
                        LeafType.module,
                        type === DependencyType.dynamic,
                        parent,
                        hasChild(subDependencies)
                    )
                );
                return;
            }
            let file = <ListItemFile> files.get(fileName) || createItem(
                fileName,
                LeafType.file,
                type === DependencyType.dynamic,
                parent,
                true,
                {
                    deps: new Set()
                }
            );
            file.isDynamic = file.isDynamic && type === DependencyType.dynamic;
            file.deps.add(moduleName);
            files.set(fileName, file);
        });
    }
    
    files.forEach((file) => {
        result.push(file);
    });
    return result;
};

export class Dependencies<TFilter extends IFilterData = IFilterData> extends Abstract<IDependencyTreeData, TFilter> {
    protected _query({
        data,
        bundles,
        where
    }: IQuery<TFilter>): Promise<IDependencyTreeData[]> | IDependencyTreeData[] {
        console.log('Dependencies => _query:', where);
        const { parent } = where;
    
        if (!parent) {
            return prepareDependencies(data, bundles, GLOBAL_MODULE_NAME, getModuleDependencies(data, GLOBAL_MODULE_NAME));
        }
    
        let [ module, type ] = <[string, LeafType]> deserialize(parent);
    
        if (type == LeafType.file) {
            return getForFile(data, bundles, module, parent);
        }
        return prepareDependencies(data, bundles, parent, getModuleDependencies(data, module));
    }
}
