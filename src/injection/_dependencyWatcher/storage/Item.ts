import { ModuleStorage } from "./Module";
import { FileStorage } from "./File";
import { IModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";
import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IItem, IItemFilter, ITransferItem, UpdateItemParam } from "Extension/Plugins/DependencyWatcher/IItem";
import { getFileName } from "../require/getFileName";
import { Require } from "../Require";
import { applyPaging } from "Extension/Plugins/DependencyWatcher/data/applyPaging";
import { DependencyType } from "Extension/Plugins/DependencyWatcher/const";
import applySort from "Extension/Plugins/DependencyWatcher/data/applySort";
import applyWhere from "Extension/Plugins/DependencyWatcher/data/applyWhere";
import findFile from "./item/findFile";
import itemsSort from "Extension/Plugins/DependencyWatcher/data/sort/itemsSort";
import itemFilters from "Extension/Plugins/DependencyWatcher/data/filter/itemFilters";

let _toArray = (set: Set<IModule>): number[] => {
    return [...set].map(module => module.id)
};

export class Item {
    constructor(
        private __modules: ModuleStorage,
        private __files: FileStorage,
        private __require: Require
    ) {
    
    }
    query({
        keys,
        where = {},
        offset = 0,
        limit,
        sortBy = {}
    }: Partial<QueryParam<IItem, IItemFilter>>): QueryResult<number> {
        let items = this.__getItems(keys);
        const filteredItems = applyWhere(items, where, itemFilters);
        const sortedItems =  <IItem[]> applySort(filteredItems, sortBy, itemsSort);
        const resultKeys: number[] = sortedItems.map(({ id }: IItem) => id);
        return applyPaging<number>(resultKeys, offset, limit);
    }
    getItems(keys: number[]): ITransferItem[] {
        return this.__getItems(keys).map((item: IItem) => {
            let { dependent, dependencies } = item;
            return {
                ...item,
                dependent: {
                    [DependencyType.static]: _toArray(dependent.static),
                    [DependencyType.dynamic]: _toArray(dependent.dynamic),
                },
                dependencies: {
                    [DependencyType.static]: _toArray(dependencies.static),
                    [DependencyType.dynamic]: _toArray(dependencies.dynamic),
                }
            }
        })
    }
    updateItem(param: UpdateItemParam): boolean {
        const module = this.__modules.getItem(param.id);
        if (!module) {
            return false;
        }
        const { fileName, size, path } = param;
        if (!(fileName || size || path)) {
            return false;
        }
        let file = this.__files.getItem(<number> module.fileId);
        if (!file) {
            return false;
        }
        file.name = fileName || file.name;
        file.size = size || file.size;
        file.path = path || file.path;
        return true;
    }
    updateItems(params: UpdateItemParam[]): boolean[] {
        return params.map((param) => {
            return this.updateItem(param);
        });
    }
    private __getItems(keys?: number[]): IItem[] {
        let modules = this.__modules.getModules(keys);
        const _require = this.__require.getOrigin();
        modules.forEach((module) => {
            if (!module.fileId) {
                this.__addFileId(module);
            }
            if (!module.defined) {
                module.defined = _require.defined(module.name);
            }
        });
        return modules.map<IItem>((module: IModule) => {
            const file = <IFile> this.__files.getItem( <number> module.fileId);
            const {
                size,
                path,
                name
            } = file;
            return <IItem> {
                ...module,
                size, path,
                fileName: name
            }
        });
    }
    private __addFileId(module: IModule) {
        const bundle = findFile(this.__require.getConfig().bundles, module.name) || '';
        const name = getFileName(
            module.name,
            this.__require.getOrigin(),
            bundle,
            this.__require.getConfig().buildMode
        );
        const file: IFile = this.__files.find(name) || this.__files.create(name, 0);
        file.modules.add(module.id);
        module.fileId = file.id;
    }
}
