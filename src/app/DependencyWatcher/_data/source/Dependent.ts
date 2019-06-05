import { DependencyType, GLOBAL_MODULE_NAME, } from 'Extension/Plugins/DependencyWatcher/const';
import { Abstract } from "./Abstract";
import { deserialize, serialize } from "./util/id";
import { dependent } from "../types";
// @ts-ignore
import { Query } from 'Types/source';
import { ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";

let isGlobal = (module: string): boolean => {
    return module === GLOBAL_MODULE_NAME;
};

let getAllModules = (record: ModulesRecord<TransferModule>): dependent.Item[] => {
    let results = [];
    for (let name in record) {
        if (isGlobal(name)) {
            continue;
        }
        results.push({
            name,
            isDynamic: false,
            id: serialize(name),
            parent: undefined,
            child: true,
            size: record[name].size
        });
    }
    return results;
};

let getCreator = (isDynamic: boolean) => {
    return (name: string, parent: string): dependent.Item => {
        return {
            name,
            isDynamic,
            id: serialize(name),
            parent,
            child: true,
        }
    };
};

let getDependentModules = (
    record: ModulesRecord<TransferModule>,
    parentModuleName: string | void,
    parentId: string | void,
    pageName: string
): dependent.Item[] => {
    let result: dependent.Item[] = [];
    if (!parentModuleName || !record[parentModuleName ]) {
        return result;
    }
    let parentModule = record[parentModuleName ];
    
    let dependent = Object.values(record).forEach((module: TransferModule) => {
        if (parentModule.dependent.static.includes(module.id)) {
            result.push({
                name: module.name,
                isDynamic: false,
                id: serialize(name),
                parent: <string> parentId,
                child: true,
                size: module.size
            });
            return ;
        }
        if (parentModule.dependent.dynamic.includes(module.id)) {
            result.push({
                name: module.name,
                isDynamic: true,
                id: serialize(name),
                parent: <string> parentId,
                child: true,
                size: module.size
            });
            return ;
        }
    });

    if (!result.length) {
        return [{
            name: <string> parentModule.bundle,
            child: false,
            isDynamic: false,
            parent: <string> parentId,
            id: serialize(<string> parentModule.bundle)
        }]
    }
    return result;
};

let getModules = (
    record: ModulesRecord<TransferModule>,
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
        ]).then(([ modules, pageName ]: [ModulesRecord<TransferModule>, string]) => {
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
