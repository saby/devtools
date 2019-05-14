// @ts-ignore
import { IModuleDependency, IModulesDependencyMap } from "Extension/Plugins/DependencyWatcher/Module";
import { IDependentTreeData, IFilterData } from "../../interface/View";
import { DependencyType, GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { deserialize, serialize } from "../util/id";
import { IQuery } from "./IQuery";

type Cache = Record<string, string[]>;

let isGlobal = (module: string): boolean => {
    return module === GLOBAL_MODULE_NAME;
};

let getAllModules = (data: IModulesDependencyMap): string[] => {
    let set: string[] = [];
    data.forEach((value, name: string) => {
        if (isGlobal(name)) {
            return;
        }
        set.push(name);
    });
    return set;
};

let getDependentModules = (data: IModulesDependencyMap, module: string): string[] => {
    let result: string[] = [];
    if (isGlobal(module)) {
        return  result;
    }
    data.forEach((dependencies, name: string) => {
       for (let type in dependencies) {
           if (dependencies[<DependencyType> type].includes(module)) {
               result.push(name)
           }
       }
    });
    return result;
};

let getModules = (data: IModulesDependencyMap, module: string | void, cache: Cache): string[] => {
    if (!module) {
        return getAllModules(data);
    }
    if (cache && cache[module]) {
        return cache[module];
    }
    let result = getDependentModules(data, module);
    cache[module] = result;
    return result;
};

let getPageName = (): string => {
    return 'page'
};

export class Dependent<TFilter extends IFilterData = IFilterData> extends Abstract<IDependentTreeData, TFilter> {
    private __dependentCache: Cache;
    private __lastSize: number;
    protected _query({
         data,
         bundles,
         where
    }: IQuery<TFilter>): Promise<IDependentTreeData[]> | IDependentTreeData[] {
        console.log('Dependent => _query:', where);
        
        if (this.__lastSize !== data.size) {
            this.__lastSize = data.size;
            this.__dependentCache = Object.create(null);
        }

        const { parent } = where;
        
        let module = parent? deserialize(parent)[0]: undefined;

        return getModules(data, module, this.__dependentCache).map((name: string) => {
            return {
                name: isGlobal(name)? getPageName(): name,
                id: serialize(name),
                parent,
                child: !isGlobal(name) || null,
            }
        });
    }
}
