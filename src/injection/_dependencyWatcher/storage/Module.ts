import { Storage } from './Storage';
import {
   IModule,
   IModuleFilter,
   IModuleInfo
} from 'Extension/Plugins/DependencyWatcher/IModule';
import { DependencyType } from 'Extension/Plugins/DependencyWatcher/const';
import { ignoredPlugins, IRequirePlugin } from '../require/ignoredPlugins';
import filterHelpers from './module/filterHelpers';
import addDynamic from './module/addDynamic';
import addStatic from './module/addStatic';
import create from './module/create';
import moduleFilters from 'Extension/Plugins/DependencyWatcher/data/filter/moduleFilters';
import modulesSort from 'Extension/Plugins/DependencyWatcher/data/sort/modulesSort';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import { Update } from './Update';
import { UpdateParam } from './IUpdate';

const noop = () => {
   /* nope */
};

function mapIgnoredPlugins(module: string): string {
   ignoredPlugins.forEach((plugin: IRequirePlugin) => {
      module = plugin(module);
   });
   return module;
}

type UpdateHandler = (moduleId: number) => void;

/**
 * Хранилище модулей
 * @class
 * @param {(moduleId: number) => void} Обработчик события обновления
 */
export class ModuleStorage extends Update<
   IModule,
   IModuleFilter,
   UpdateParam<IModuleInfo>
> {
   private readonly _storage: Storage<IModule, string> = new Storage('name');

   /**
    * Флаг пометки что данные уже читались.
    * Нужен для того, чтобы не слать события обновления на панель девтула, если список ещё не открывался
    */
   private _wasRead: boolean = false;
   constructor(private _onUpdate: UpdateHandler = noop) {
      super();
   }

   define(name: string, dependencies: string[], moduleData: unknown): void {
      const module = this.__get(name);
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
      const module = this.__get(name);
      module.initialized = true;
      if (this._wasRead) {
         this._markUpdated(module.id);
         this._onUpdate(module.id);
      }
   }

   require(
      name: string,
      dependencies: string | string[],
      type: DependencyType = DependencyType.dynamic
   ): void {
      const module = this.__get(name);
      this.__addDeps(
         module,
         Array.isArray(dependencies) ? dependencies : [dependencies],
         type
      );
   }

   getItem(id: number): IModule | void {
      return this._getItem(id);
   }

   getItems(keys?: number[]): IModule[] {
      this._wasRead = true;
      return this._storage.getItemsById(keys);
   }

   openSource(id: number): boolean {
      const module = this._storage.getItemById(id);
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
      let module = this._storage.getItemByIndex(name);
      if (!module) {
         module = create(name);
         this._storage.add(module);
      }
      return module;
   }

   private __addDeps(
      module: IModule,
      dependencies: string[],
      type: DependencyType
   ): void {
      const _dependencies = dependencies
         .filter(filterHelpers)
         .filter((dependency) => !!dependency)
         .map(mapIgnoredPlugins)
         .map(
            (dependency: string): IModule => {
               return this.__get(dependency);
            }
         );

      if (!_dependencies.length) {
         return;
      }
      let updates;
      if (type === DependencyType.dynamic) {
         updates = addDynamic(module, _dependencies);
      } else {
         updates = addStatic(module, _dependencies);
      }
      /*
       * Кидаем собыетие об обновлении только после того как модули будут хоть раз вычитаны
       * Нет смысла забивать канал сообщениями, если вкладка не открыта
       */
      if (this._wasRead && updates.length) {
         this._markUpdated(module.id);
         updates.forEach(({ id }: IModule) => {
            this._markUpdated(id);
         });
         this._onUpdate(module.id);
      }
   }

   /// region Query
   protected _getFilters(): Partial<
      Record<keyof IModuleFilter, FilterFunctionGetter<any, IModule>>
   > {
      return moduleFilters;
   }
   protected _getSorting(): Record<keyof IModule, SortFunction<IModule>> {
      return modulesSort;
   }
   protected _getItems(keys?: number[]): IModule[] {
      return this._storage.getItemsById(keys);
   }
   /// endregion Query
   /// region Update
   protected _getItem(id: number): IModule | void {
      return this._storage.getItemById(id);
   }
   /// endregion Update
}
