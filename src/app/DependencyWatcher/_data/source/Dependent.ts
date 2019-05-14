// @ts-ignore
import { IModulesDependencyMap } from "Extension/Plugins/DependencyWatcher/Module";
import { DependencyType, GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { deserialize, serialize } from "./util/id";
import { dependent } from "../types";
// @ts-ignore
import { Query } from 'Types/source';
import * as markers from "../markers";

type Cache = Record<string, [DependencyType, string][]>;

let isGlobal = (module: string): boolean => {
    return module === GLOBAL_MODULE_NAME;
};

let getAllModules = (data: IModulesDependencyMap): [DependencyType, string][] => {
    let set: [DependencyType, string][] = [];
    data.forEach((value, name: string) => {
        if (isGlobal(name)) {
            return;
        }
        set.push([DependencyType.static, name]);
    });
    return set;
};

let getDependentModules = (data: IModulesDependencyMap, module: string): [DependencyType, string][] => {
    let result: [DependencyType, string][] = [];
    if (isGlobal(module)) {
        return result;
    }
    data.forEach((dependencies, name: string) => {
       for (let type in dependencies) {
           let _type = <DependencyType> type;
           if (dependencies[_type].includes(module)) {
               result.push([_type, name])
           }
       }
    });
    return result;
};

let getModules = (data: IModulesDependencyMap, module: string | void, cache: Cache): [DependencyType, string][] => {
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

export class Dependent<
    TFilter extends dependent.IFilterData = dependent.IFilterData
> extends Abstract<dependent.Item, TFilter> {
    private __dependentCache: Cache;
    private __lastSize: number;
    protected _query(query: Query<TFilter>): Promise<dependent.Item[]> {
        console.log('Dependent => _query:', query);
    
        const { parent } = query.getWhere();
    
        let module = parent? deserialize(parent)[0]: undefined;
        
        return this._getModules().then((modules) => {
            if (this.__lastSize !== modules.size) {
                this.__lastSize = modules.size;
                this.__dependentCache = Object.create(null);
            }
            
            return getModules(modules, module, this.__dependentCache);
        }).then((modules: [DependencyType, string][]) => {
            return modules.map(([type, name]) => {
                return {
                    name: isGlobal(name)? getPageName(): name,
                    id: serialize(name),
                    parent,
                    child: !isGlobal(name) || null,
                    markers: type == DependencyType.dynamic? [markers.dynamic]: undefined
                }
            });
        });
    }

    protected _read<
        TKey extends string,
        TMeta = unknown
        >(id: TKey, meta?: TMeta): Promise<dependent.Item> | dependent.Item {
        let [ name ] = deserialize(id);
        return Promise.resolve(<dependent.Item> {
            name,
            child: false,
            id,
        });
    }
}
