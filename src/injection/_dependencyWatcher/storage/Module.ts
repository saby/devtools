import { Storage } from "./Storage";
import { IModule, IModuleFilter, IModuleInfo } from 'Extension/Plugins/DependencyWatcher/IModule';
import {
    DependencyType,
} from "Extension/Plugins/DependencyWatcher/const";
import { ignoredPlugins, IRequirePlugin } from "../require/ignoredPlugins";
import filterHelpers from "./module/filterHelpers";
import addDynamic from "./module/addDynamic";
import addStatic from "./module/addStatic";
import create from "./module/create";
import moduleFilters from "Extension/Plugins/DependencyWatcher/data/filter/moduleFilters";
import modulesSort from "Extension/Plugins/DependencyWatcher/data/sort/modulesSort";
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import { Update } from './Update';
import { UpdateParam } from './IUpdate';

const nope = () => {/* nope */};

let mapIgnoredPlugins = (module: string): string => {
    ignoredPlugins.forEach((plugin: IRequirePlugin) => {
        module = plugin(module);
    });
    return module;
};

interface UpdateHandler {
    (moduleId: number): void;
}

/**
 * Хранилище модулей
 * @class
 * @param {(moduleId: number) => void} Обработчик события обновления
 */
export class ModuleStorage extends Update<IModule, IModuleFilter, UpdateParam<IModuleInfo>> {
    private readonly __storage: Storage<IModule, string> = new Storage('name');
    constructor(private __onupdate: UpdateHandler = nope) {
        super();
    }

    /**
     * Флаг пометки что данные уже читались.
     * Нужен для того, чтобы не слать события обновления на панель девтула, если список ещё не открывался
     */
    private __wasRead: boolean = false;

    define(name: string, dependencies: string[], moduleData: unknown): void {
        let module = this.__get(name);
        if (typeof moduleData !== 'function') {
            module.initialized = true;
        }
        module.defined = true;
        module.data = moduleData;
        this.__addDeps(module, dependencies, DependencyType.static);
    }

    /**
     * Инициализации модуля
     */
    initModule(name: string): void {
        let module = this.__get(name);
        module.initialized = true;
        if (this.__wasRead) {
            this._markUpdated(module.id);
            this.__onupdate(module.id);
        }
    }

    require(name: string, dependencies: string | string[], type: DependencyType = DependencyType.dynamic) {
        let module = this.__get(name);
        this.__addDeps(
            module,
            Array.isArray(dependencies)?
                dependencies:
                [dependencies],
            type
        );
    }

    getItem(id: number): IModule | void {
        return this._getItem(id);
    }

    getItems(keys?: number[]): IModule[] {
        this.__wasRead = true;
        return this.__storage.getItemsById(keys);
    }

    openSource(id: number): boolean {
        const module = this.__storage.getItemById(id);
        if (!module) {
            return false;
        }
        if (!module.defined) {
            return false;
        }
        // TODO: открывать все файлы через одно место
        window.__WASABY_DEV_MODULE__ = module.data;
        return true;
    }
    private __get(name: string): IModule {
        let module = this.__storage.getItemByIndex(name);
        if (!module) {
            module = create(name);
            this.__storage.add(module);
        }
        return module;
    }

    private __addDeps(module: IModule, dependencies: string[], type: DependencyType) {
        const _dependencies = dependencies.
        filter(filterHelpers).
        filter(dependency => !!dependency).
        map(mapIgnoredPlugins).
        map((dependency: string): IModule => {
            return this.__get(dependency);
        });

        if (!_dependencies.length) {
            return;
        }
        let updates;
        if (type == DependencyType.dynamic) {
            updates = addDynamic(module, _dependencies);
        } else {
            updates = addStatic(module, _dependencies);
        }
        /*
         * Кидаем собыетие об обновлении только после того как модули будут хоть раз вычитаны
         * Нет смысла забивать канал сообщениями, если вкладка не открыта
         */
        if (this.__wasRead && updates.length) {
            this._markUpdated(module.id);
            updates.forEach(({ id }: IModule) => {
                this._markUpdated(id);
            });
            this.__onupdate(module.id);
        }
    }

    /// region Query
    protected _getFilters(): Partial<Record<keyof IModuleFilter, FilterFunctionGetter<any, IModule>>> {
        return moduleFilters;
    }
    protected _getSorting(): Record<keyof IModule, SortFunction<IModule>> {
        return modulesSort;
    }
    protected _getItems(keys?: number[]): IModule[] {
        return this.__storage.getItemsById(keys);
    }
    /// endregion Query
    /// region Update
    protected _getItem(id: number): IModule | void {
        return this.__storage.getItemById(id);
    }
    /// endregion Update
}
