import { ModuleStorage } from "./Module";
import { FileStorage } from "./File";
import { IModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { IFile, IFileFilter } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IItem, IItemFilter, ITransferItem, UpdateItemParam } from "Extension/Plugins/DependencyWatcher/IItem";
import { getFileName } from "../require/getFileName";
import { Require } from "../Require";
import { DependencyType } from "Extension/Plugins/DependencyWatcher/const";
import itemsSort from "Extension/Plugins/DependencyWatcher/data/sort/itemsSort";
import itemFilters from "Extension/Plugins/DependencyWatcher/data/filter/itemFilters";
import { ILogger } from "Extension/Logger/ILogger";
import { Query } from './Query';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import { QueryParam, QueryResult } from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { isRelease } from '../require/isRelease';

let _toArray = (set: Set<IModule>): number[] => {
    return [...set].map(module => module.id)
};

export class Item extends Query<IItem, IItemFilter> {
    constructor(
        private __modules: ModuleStorage,
        private __files: FileStorage,
        private __require: Require,
        private __logger: ILogger
    ) {
        super();
    }
    query(queryParams: Partial<QueryParam<IItem, IItemFilter>>): QueryResult<number> {
        this.__beforeQuery(queryParams);
        const _queryParams = this.__prepareParams(queryParams);
        return super.query(_queryParams);
    }
    protected _getItems(keys?: number[]): IItem[] {
        let modules = this.__modules.getModules(keys);
        modules.forEach((module: IModule) => {
            this.__addFileId(module);
            this.__addDefined(module);
        });
        return modules.map<IItem>((module: IModule) => {
            const file = <IFile> this.__files.getItem( <number> module.fileId);
            const {
                  size,
                  path,
            } = file;
            const { defined, initialized, id, name, fileId, dependent, dependencies } = module;
            return <IItem> {
                defined, initialized, id, name, fileId, dependent, dependencies,
                size, path,
                fileName: file.name
            }
        });
    }
    protected _getFilters(): Partial<Record<keyof IItemFilter, FilterFunctionGetter<any, IItem>>> {
        return itemFilters;
    }
    protected _getSorting(): Record<keyof IItem, SortFunction<IItem>> {
        return itemsSort;
    }

    getItems(keys: number[]): ITransferItem[] {
        return this._getItems(keys).map((item: IItem) => {
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
    private __updateFileId() {
        const _keys = this.__modules.query({
            where: { files: [Number.MIN_SAFE_INTEGER] }
        }).data;
        const modules = this.__modules.getModules(_keys);
        modules.forEach(this.__addFileId.bind(this));
    }
    private __addFileId(module: IModule) {
        if (module.fileId !== Number.MIN_SAFE_INTEGER) {
            return;
        }
        const fileName = getFileName(
            module.name,
            this.__require.getOrigin(),
            isRelease(this.__require.getConfig().buildMode),
            this.__require.getConfig().bundles
        );
        const file: IFile = this.__files.find(fileName) || this.__files.create(fileName, 0);
        file.modules.add(module.id);
        module.fileId = file.id;
    }
    private __updateDefined() {
        this.__modules.getModules().forEach(this.__addDefined.bind(this));
    }
    private __addDefined(module: IModule) {
        if (!module.initialized) {
            module.initialized = this.__require.getOrigin().defined(module.name);
        }
        if (module.initialized && !module.defined) {
            this.__logger.warn('');
            module.defined = true;
        }
    }
    
    /**
     * Предпроход по данным перед отправкой с целью заполнения недостающих данных
     * @private
     */
    private __beforeQuery({ where, sortBy }: Partial<QueryParam<IItem, IItemFilter>>): void {
        // Если фильтрация по файлам или сортировка по имени файла, то проставляем файлы модулям, у которых их нет
        if (
            where && (
                where.files && where.files.length ||
                where.dependentOnFiles && where.dependentOnFiles.length
            ) ||
            sortBy && typeof sortBy.fileName == 'boolean'
        ) {
            this.__updateFileId();
        }
        // Если сортировка по используемости модуля, то перепроверяем, что не пропустили
        if (sortBy && typeof sortBy.initialized == 'boolean') {
            this.__updateDefined();
        }
    }

    /**
     * Подготовка параметров получения Items  с целью оптимизации
     * если в фильтре указаны файлы, то получаем сразу модули файла, вместо перебора
     * @private
     */
    private __prepareParams(params: Partial<QueryParam<IItem, IItemFilter>>): Partial<QueryParam<IItem, IItemFilter>> {
        const { keys, where } = params;
        if (keys && keys.length || !where) {
            return params;
        }
        let _keys: number[] | undefined;
        if (Array.isArray(where.files) && where.files.length) {
            _keys = this.__gitForFiles(where.files);
            delete where.files;
        }
        if (Array.isArray(where.dependentOnFiles) && where.dependentOnFiles.length) {
            _keys = this.__getDependentOnFiles(where.dependentOnFiles, _keys);
            delete where.dependentOnFiles;
        }
        
        return {
            ...params,
            keys: _keys
        };
    }
    private __gitForFiles(files: number[]): number[] {
        return this.__files.getItems(files).map((file: IFile) => {
            return Array.from(file.modules);
        }).reduce((prev: number[], cur: number[]) => {
            return [...prev, ...cur]
        });
    }
    private __getDependentOnFiles(files: number[], keys?: number[]): number[] {
        return this.__modules.query({
            keys,
            where: {
                dependentOnFiles: files
            }
        }).data;
    }
}
