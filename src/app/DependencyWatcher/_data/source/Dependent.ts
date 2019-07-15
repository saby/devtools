import { GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { createId, getId } from "./util/id";
import { dependent } from "../types";
import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";
import { findModule } from "./util/findModule";

let isGlobal = (module: string): boolean => {
    return module === GLOBAL_MODULE_NAME;
};

let hasChild = (module?: Module): true | null => {
    if (!module) {
        return null;
    }
    let { dependent } = module;
    return (dependent.dynamic && dependent.dynamic.size > 0) ||
        (dependent.static && dependent.static.size > 0) || null;
};

let getAllModules = (map: ModulesMap): dependent.Item[] => {
    let results: dependent.Item[] = [];
    
    map.forEach((module: Module, name: string) => {
        if (isGlobal(name)) {
            return;
        }
        let { fileId, id, defined } = module;
        const child = hasChild(module);
        results.push({
            name, fileId, defined: defined,
            isDynamic: false,
            id: createId(id),
            parent: undefined,
            child
        });
    });
    return results;
};

let getEachHandler = (results: dependent.Item[], isDynamic: boolean, parentItemId?: string) => {
    return (module: Module) => {
        let { name, fileId, id, defined } = module;
        const child = hasChild(module);
        results.push({
            name, fileId, defined: defined,
            isDynamic,
            id: createId(id, parentItemId),
            parent: <string> parentItemId,
            child
        });
    }
};

let getDependentModules = (
    map: ModulesMap,
    parentModuleId: string | void,
    parentItemId: string | void,
): dependent.Item[] => {
    let result: dependent.Item[] = [];
    if (!parentModuleId) {
        return result;
    }

    let parentModule = findModule(map, parentModuleId);

    if (!parentModule) {
        return result;
    }

    parentModule.dependent.static.forEach(getEachHandler(result, false, <string> parentItemId));
    parentModule.dependent.dynamic.forEach(getEachHandler(result, true, <string> parentItemId));
    return result;
};

let getModules = (
    record: ModulesMap,
    parentModuleId: string | void,
    parentItemId: string | void,
): dependent.Item[] => {
    if (!parentModuleId) {
        return getAllModules(record);
    }
    return getDependentModules(record, parentModuleId, parentItemId);
};

export class Dependent<
    TFilter extends dependent.IFilterData = dependent.IFilterData
> extends Abstract<dependent.Item, TFilter> {
    protected _query(map: ModulesMap, where: TFilter): Promise<dependent.Item[]> {
        console.log('Dependent => _query:', where);
        const { parent } = where;

        let parentModuleId = parent? getId(parent): undefined;
    
        return Promise.resolve(getModules(map, parentModuleId, parent));
    }
    private __pageName: string;
    private __getPageName(): Promise<string> {
        if (this.__pageName) {
            return Promise.resolve(this.__pageName);
        }
        const DEFAULT = 'page';
        return new Promise<string>((resolve, reject) => {
            let timer = setTimeout(resolve, 1000, DEFAULT);
            chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab: chrome.tabs.Tab) => {
                resolve(tab.url || DEFAULT);
                clearTimeout(timer);
            });
        }).then((name: string) => {
            this.__pageName = name;
            return name;
        });
    }
}
