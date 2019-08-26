import { ModuleStorage } from "../storage/Module";
import { FileStorage } from "../storage/File";
import { IModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { IFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IRPCModule, IRPCModeuleFilter, ITransferRPCModule, UpdateItemParam } from "Extension/Plugins/DependencyWatcher/IRPCModule";
import { getFileName } from "../require/getFileName";
import { Require } from "../Require";
import { DependencyType } from "Extension/Plugins/DependencyWatcher/const";
import itemsSort from "Extension/Plugins/DependencyWatcher/data/sort/itemsSort";
import itemFilters from "Extension/Plugins/DependencyWatcher/data/filter/itemFilters";
import { ILogger } from "Extension/Logger/ILogger";
import { Query } from '../storage/Query';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import { QueryParam, QueryResult } from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { isRelease } from '../require/isRelease';
import { IUpdate } from '../storage/IUpdate';

let _toArray = (set: Set<IModule>): number[] => {
    return [...set].map(module => module.id)
};

/**
 * Класс - обёртка над хранилищем модулей и файлов, необходимый для постоения списка модулей,
 * расширеными данными файлов, в которых они хранятся (путь до файла, размер)
 */
export class Module extends Query<IRPCModule, IRPCModeuleFilter> implements IUpdate<IRPCModule> {
    constructor(
        private __modules: ModuleStorage,
        private __files: FileStorage,
        private __require: Require,
        private __logger: ILogger
    ) {
        super();
    }
    query(queryParams: Partial<QueryParam<IRPCModule, IRPCModeuleFilter>>): QueryResult<number> {
        this.__beforeQuery(queryParams);
        const _queryParams = this.__prepareParams(queryParams);
        return super.query(_queryParams);
    }

    updateItems(params: UpdateItemParam[]): boolean[] {
        return params.map((param) => {
            return this.__updateItem(param);
        });
    }

    hasUpdates(keys: number[]): boolean[] {
        return this.__modules.hasUpdates(keys);
        // TODO Пройтись по модулям, которые не обновлялись и проверить не обновились ли файлы, в которых они лежат
    }
    getItems(keys: number[]): ITransferRPCModule[] {
        return this._getItems(keys).map((item: IRPCModule) => {
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
    openSource(id: number): boolean {
        return this.__modules.openSource(id);
    }
    /// region Query
    protected _getItems(keys?: number[]): IRPCModule[] {
        let modules = this.__modules.getItems(keys);
        modules.forEach((module: IModule) => {
            this.__addFileId(module);
            this.__addDefined(module);
        });
        return modules.map<IRPCModule>((module: IModule) => {
            const file = <IFile> this.__files.getItem( <number> module.fileId);
            const {
                  size,
                  path,
            } = file;
            const { defined, initialized, id, name, fileId, dependent, dependencies } = module;
            return <IRPCModule> {
                defined, initialized, id, name, fileId, dependent, dependencies,
                size, path,
                fileName: file.name
            }
        });
    }
    protected _getFilters(): Partial<Record<keyof IRPCModeuleFilter, FilterFunctionGetter<any, IRPCModule>>> {
        return itemFilters;
    }
    protected _getSorting(): Record<keyof IRPCModule, SortFunction<IRPCModule>> {
        return itemsSort;
    }
    /// endregion Query
    /// region IUpdate
    private __updateItem(param: UpdateItemParam): boolean {
        const module = this.__modules.getItem(param.id);
        if (!module) {
            return false;
        }
        if (Object.keys(param).length == 1) {
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
        // TODO update Module fields
    }
    /// endregion IUpdate
    private __updateFileId() {
        const _keys = this.__modules.query({
            where: { files: [Number.MIN_SAFE_INTEGER] }
        }).data;
        const modules = this.__modules.getItems(_keys);
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
        this.__modules.getItems().forEach(this.__addDefined.bind(this));
    }
    private __addDefined(module: IModule) {
        if (!module.initialized) {
            module.initialized = this.__require.getOrigin().defined(module.name);
        }
        if (module.initialized && !module.defined) {
            // тут не AMD модули пришли в ответ
            module.defined = true;
        }
    }
    
    /**
     * Предпроход по данным перед отправкой с целью заполнения недостающих данных
     * @private
     */
    private __beforeQuery({ where, sortBy }: Partial<QueryParam<IRPCModule, IRPCModeuleFilter>>): void {
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
    private __prepareParams(params: Partial<QueryParam<IRPCModule, IRPCModeuleFilter>>): Partial<QueryParam<IRPCModule, IRPCModeuleFilter>> {
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
