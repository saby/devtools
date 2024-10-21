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
import itemsSort from '../data/sort/itemsSort';
import itemFilters from '../data/filter/itemFilters';
import { Query } from '../storage/Query';
import { FilterFunctionGetter } from '../data/filter/Filter';
import { SortFunction } from '../data/sort/Sort';
import {
   IQueryParam,
   IQueryResult
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { isRelease } from '../require/isRelease';

function setToIdArray(set: Set<IModule>): number[] {
   return Array.from(set).map((module) => module.id);
}

/**
 * Wrapper around the storages of the files and modules used to construct the list of modules with the data about files where they're stored (path).
 * @author Зайцев А.С.
 */
export class Module extends Query<IRPCModule, IRPCModuleFilter> {
   constructor(
      private _moduleStorage: ModuleStorage,
      private _files: FileStorage,
      private _require: Require
   ) {
      super();
   }

   query(
      queryParams: IQueryParam<IRPCModule, IRPCModuleFilter>
   ): IQueryResult<number> {
      const _queryParams = this.__prepareParams(queryParams);
      return super.query(_queryParams);
   }

   hasUpdates(keys: number[]): boolean[] {
      return this._moduleStorage.hasUpdates(keys);
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
            dependencies,
            isDeprecated
         }: IModule) => {
            const file = this._files.getItem(fileId);
            let path = '';
            let fileName = '';
            if (file) {
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
               path,
               fileName,
               isDeprecated
            };
         }
      );
   }
   protected _getFilters(): Partial<
      Record<keyof IRPCModuleFilter, FilterFunctionGetter<unknown, IRPCModule>>
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
            file.modules.add(module.id);
            module.fileId = file.id;
            return;
         }
      }
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
      params: IQueryParam<IRPCModule, IRPCModuleFilter>
   ): Partial<IQueryParam<IRPCModule, IRPCModuleFilter>> {
      const {
         keys,
         where
      }: Partial<IQueryParam<IRPCModule, IRPCModuleFilter>> = params;
      if (keys) {
         return params;
      }
      let _keys: number[] | undefined;
      if (where.files) {
         if (where.files.length) {
            _keys = this.__getModulesOfFiles(where.files);
         }
         delete where.files;
      }
      if (where.dependentOnFiles) {
         if (where.dependentOnFiles.length) {
            _keys = this.__getDependentOnFiles(where.dependentOnFiles, _keys);
         }
         delete where.dependentOnFiles;
      }

      return {
         ...params,
         keys: _keys
      };
   }
   private __getModulesOfFiles(fileIds: number[]): number[] {
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
