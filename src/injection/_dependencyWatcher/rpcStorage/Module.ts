import { ModuleStorage } from '../storage/Module';
import { FileStorage } from '../storage/File';
import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';
import { IFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import {
   IRPCModule,
   IRPCModuleFilter,
   ITransferRPCModule
} from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { getFileNames } from '../require/getFileNames';
import { Require } from '../Require';
import { DependencyType } from 'Extension/Plugins/DependencyWatcher/const';
import itemsSort from 'Extension/Plugins/DependencyWatcher/data/sort/itemsSort';
import itemFilters from 'Extension/Plugins/DependencyWatcher/data/filter/itemFilters';
import { Query } from '../storage/Query';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import {
   IQueryParam,
   IQueryResult
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { isRelease } from '../require/isRelease';
import { IUpdate } from '../storage/IUpdate';

function setToIdArray(set: Set<IModule>): number[] {
   return [...set].map((module) => module.id);
}

/**
 * Класс - обёртка над хранилищем модулей и файлов, необходимый для постоения списка модулей,
 * расширеными данными файлов, в которых они хранятся (путь до файла, размер)
 */
export class Module extends Query<IRPCModule, IRPCModuleFilter>
   implements IUpdate<IRPCModule> {
   constructor(
      private _moduleStorage: ModuleStorage,
      private _files: FileStorage,
      private _require: Require
   ) {
      super();
   }
   query(
      queryParams: Partial<IQueryParam<IRPCModule, IRPCModuleFilter>>
   ): IQueryResult<number> {
      const _queryParams = this.__prepareParams(queryParams);
      return super.query(_queryParams);
   }

   hasUpdates(keys: number[]): boolean[] {
      const items = this._getItems(keys);
      const updatedItems = this._moduleStorage.hasUpdates(keys);
      return items.map((item, index) => {
         if (updatedItems[index]) {
            return true;
         } else {
            const fileId = item.fileId;
            if (fileId === Number.MIN_SAFE_INTEGER) {
               return false;
            } else {
               return this._files.hasUpdates([fileId])[0];
            }
         }
      });
   }
   getItems(keys: number[]): ITransferRPCModule[] {
      return this._getItems(keys).map((item: IRPCModule) => {
         const { dependent, dependencies }: IRPCModule = item;
         return {
            ...item,
            dependent: {
               [DependencyType.static]: setToIdArray(dependent.static),
               [DependencyType.dynamic]: setToIdArray(dependent.dynamic)
            },
            dependencies: {
               [DependencyType.static]: setToIdArray(dependencies.static),
               [DependencyType.dynamic]: setToIdArray(dependencies.dynamic)
            }
         };
      });
   }
   openSource(id: number): boolean {
      return this._moduleStorage.openSource(id);
   }
   /// region Query
   protected _getItems(keys?: number[]): IRPCModule[] {
      const modules = this._moduleStorage.getItems(keys);
      modules.forEach((module: IModule) => {
         this.__setDefined(module);
         this.__setFileId(module);
      });
      return modules.map<IRPCModule>(
         ({
            defined,
            initialized,
            id,
            name,
            fileId,
            dependent,
            dependencies
         }: IModule) => {
            const file = this._files.getItem(fileId);
            let size = 0;
            let path = '';
            let fileName = '';
            if (file) {
               size = file.size;
               path = file.path;
               fileName = file.name;
            }
            return {
               defined,
               initialized,
               id,
               name,
               fileId,
               dependent,
               dependencies,
               size,
               path,
               fileName
            } as IRPCModule;
         }
      );
   }
   protected _getFilters(): Partial<
      Record<keyof IRPCModuleFilter, FilterFunctionGetter<any, IRPCModule>>
   > {
      return itemFilters;
   }
   protected _getSorting(): Record<keyof IRPCModule, SortFunction<IRPCModule>> {
      return itemsSort;
   }
   /// endregion Query
   private __setFileId(module: IModule): void {
      /**
       * If a module is defined, it should have a file, otherwise it's not loaded.
       * It is important to avoid creating files for modules that are not loaded because it only leads to confusion.
       * Generated paths are often wrong and don't serve a real purpose. Also, they can lead to duplication, because
       * real paths and generated paths often don't have the same format.
       */
      if (module.fileId !== Number.MIN_SAFE_INTEGER || !module.defined) {
         return;
      }
      const requireConfig = this._require.getConfig();
      const fileNames = getFileNames(
         module.name,
         this._require.getOrigin(),
         isRelease(requireConfig.buildMode),
         requireConfig.bundles,
         module.dependent.static
      );
      let file: IFile | void;
      for (const fileName of fileNames) {
         file = this._files.find(fileName);
         if (file) {
            break;
         }
      }
      if (!file) {
         return;
      }
      file.modules.add(module.id);
      module.fileId = file.id;
   }
   private __setDefined(module: IModule): void {
      if (!module.initialized) {
         module.initialized = this._require.getOrigin().defined(module.name);
      }
      if (module.initialized && !module.defined) {
         // тут не AMD модули пришли в ответ
         module.defined = true;
      }
   }

   /**
    * Подготовка параметров получения Items  с целью оптимизации
    * если в фильтре указаны файлы, то получаем сразу модули файла, вместо перебора
    * @private
    */
   private __prepareParams(
      params: Partial<IQueryParam<IRPCModule, IRPCModuleFilter>>
   ): Partial<IQueryParam<IRPCModule, IRPCModuleFilter>> {
      const {
         keys,
         where
      }: Partial<IQueryParam<IRPCModule, IRPCModuleFilter>> = params;
      if ((keys && keys.length) || !where) {
         return params;
      }
      let _keys: number[] | undefined;
      if (Array.isArray(where.files) && where.files.length) {
         _keys = this.__gitForFiles(where.files);
         delete where.files;
      }
      if (
         Array.isArray(where.dependentOnFiles) &&
         where.dependentOnFiles.length
      ) {
         _keys = this.__getDependentOnFiles(where.dependentOnFiles, _keys);
         delete where.dependentOnFiles;
      }

      return {
         ...params,
         keys: _keys
      };
   }
   private __gitForFiles(fileIds: number[]): number[] {
      return this._files
         .getItems(fileIds)
         .map((file: IFile) => {
            return Array.from(file.modules);
         })
         .reduce((prev: number[], cur: number[]) => {
            return prev.concat(cur);
         });
   }
   private __getDependentOnFiles(files: number[], keys?: number[]): number[] {
      return this._moduleStorage.query({
         keys,
         where: {
            dependentOnFiles: files
         }
      }).data;
   }
}
