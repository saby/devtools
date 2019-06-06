import { DependencyType, GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { deserialize, serialize } from "./util/id";
import { dependent } from "../types";
// @ts-ignore
import { Query } from 'Types/source';
import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";

let isGlobal = (module: string): boolean => {
    return module === GLOBAL_MODULE_NAME;
};

let getAllModules = (map: ModulesMap): dependent.Item[] => {
    let results: dependent.Item[] = [];
    
    map.forEach((module: Module, name: string) => {
        if (isGlobal(name)) {
            return;
        }
        let { fileName, bundle, size } = module;
        results.push({
            name, fileName, bundle, size,
            isDynamic: false,
            id: serialize(name),
            parent: undefined,
            child: true
        });
    });
    return results;
};

let getDependentModules = (
    map: ModulesMap,
    parentModuleName: string | void,
    parentId: string | void,
    pageName: string
): dependent.Item[] => {
    let result: dependent.Item[] = [];
    if (!parentModuleName || !map.has(parentModuleName)) {
        return result;
    }
    let parentModule = <Module> map.get(parentModuleName);
    
    let getEachHandler = (results: dependent.Item[], isDynamic: boolean) => {
        return (module: Module) => {
            let { name, size, fileName, bundle } = module;
            results.push({
                name, size, fileName, bundle,
                isDynamic,
                id: serialize(name),
                parent: <string> parentId,
                child: !isGlobal(name) || null,
            });
        }
    };

    parentModule.dependent.static.forEach(getEachHandler(result, false));
    parentModule.dependent.dynamic.forEach(getEachHandler(result, true));

    if (!result.length) {
        return [{
            name: <string> parentModule.bundle,
            child: null,
            isDynamic: false,
            parent: <string> parentId,
            id: serialize(<string> parentModule.bundle)
        }]
    }
    return result;
};

let getModules = (
    record: ModulesMap,
    parentModule: string | void,
    parentId: string | void,
    pageName: string
): dependent.Item[] => {
    if (!parentModule) {
        return getAllModules(record);
    }
    return getDependentModules(record, parentModule, parentId, pageName);
};

export class Dependent<
    TFilter extends dependent.IFilterData = dependent.IFilterData
> extends Abstract<dependent.Item, TFilter> {
    protected _query(query: Query): Promise<dependent.Item[]> {
        console.log('Dependent => _query:', query);
        // @ts-ignore
        const { parent } = <TFilter> query.getWhere();

        let parentModule = parent? deserialize(parent)[0]: undefined;
        return Promise.all([
            this._getModules(),
            this.__getPageName()
        ]).then(([ modules, pageName ]: [ModulesMap, string]) => {
            return getModules(modules, parentModule, parent, pageName);
        });
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
