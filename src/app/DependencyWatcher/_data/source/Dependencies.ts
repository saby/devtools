import { GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { createId, getId } from "./util/id";
import { dependency } from "../types";
import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";
import { findModule } from "./util/findModule";

let isGlobal = (module: string): boolean => {
    return module === GLOBAL_MODULE_NAME;
};

let hasChild = (module?: Module): true | null => {
    if (!module) {
        return null;
    }
    let { dependencies } = module;
    return (dependencies.dynamic && dependencies.dynamic.size > 0) ||
        (dependencies.static && dependencies.static.size > 0) || null;
};

let getEachHandler = (results: dependency.Item[], isDynamic: boolean, parentItemId?: string) => {
    return (module: Module) => {
        let { name, fileId, id, defined } = module;
        results.push({
            name, fileId, defined,
            isDynamic,
            id: createId(id, parentItemId),
            parent: parentItemId,
            child: hasChild(module)
        });
    }
};

let getAllModules = (map: ModulesMap): dependency.Item[] => {
    let results: dependency.Item[] = [];
    map.forEach(getEachHandler(results, false));
    return results.filter(({ name }: dependency.Item) => {
        return !isGlobal(name);
    });
};

let getFromModule = (
    parentModule?: Module,
    parentItemId?: string
) => {
    if (!parentModule) {
        return <dependency.Item[]> [];
    }
    let result: dependency.Item[] = [];
    parentModule.dependencies.static.forEach(getEachHandler(result, false, parentItemId));
    parentModule.dependencies.dynamic.forEach(getEachHandler(result, true, parentItemId));
    return result;
};

let getById = (
    map: ModulesMap,
    parentModuleId: string | void,
    parentItemId?: string
): dependency.Item[] => {
    if (!parentModuleId) {
        return <dependency.Item[]> [];
    }
    return getFromModule(findModule(map, parentModuleId), parentItemId);
};

export class Dependencies<
    TFilter extends dependency.IFilterData = dependency.IFilterData
> extends Abstract<dependency.Item, TFilter> {
    protected _query(map: ModulesMap, where: TFilter): Promise<dependency.Item[]> {
        console.log('Dependencies => _query:', where);
        const { parent } = where;
        
        let parentModuleId = parent? getId(parent): undefined;
        return Promise.resolve(map).then((modules: ModulesMap) => {
            if (!parentModuleId) {
                return getAllModules(modules);
            }
            return getById(modules, parentModuleId, parent);
        });
    }
}
