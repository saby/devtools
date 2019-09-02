import { ModuleStorage } from '../storage/Module';
import { FileStorage } from '../storage/File';
import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';
import { IFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import {
   IRPCModule,
   IRPCModuleFilter,
   ITransferRPCModule,
   UpdateItemParam
} from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { getFileName } from '../require/getFileName';
import { Require } from '../Require';
import { DependencyType } from 'Extension/Plugins/DependencyWatcher/const';
import itemsSort from 'Extension/Plugins/DependencyWatcher/data/sort/itemsSort';
import itemFilters from 'Extension/Plugins/DependencyWatcher/data/filter/itemFilters';
import { ILogger } from 'Extension/Logger/ILogger';
import { Query } from '../storage/Query';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import {
   IQueryParam,
   IQueryResult
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { isRelease } from '../require/isRelease';
import { IUpdate } from '../storage/IUpdate';

const _toArray = (set: Set<IModule>): number[] => {
   return [...set].map((module) => module.id);
};

/**
 * Класс - обёртка над хранилищем модулей и файлов, необходимый для постоения списка модулей,
 * расширеными данными файлов, в которых они хранятся (путь до файла, размер)
 */
export class Module extends Query<IRPCModule, IRPCModuleFilter>
   implements IUpdate<IRPCModule> {
   constructor(
      private _modules: ModuleStorage,
      private _files: FileStorage,
      private _require: Require,
      private _logger: ILogger
   ) {
      super();
   }
   query(
      queryParams: Partial<IQueryParam<IRPCModule, IRPCModuleFilter>>
   ): IQueryResult<number> {
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
      return this._modules.hasUpdates(keys);
      // TODO Пройтись по модулям, которые не обновлялись и проверить не обновились ли файлы, в которых они лежат
   }
   getItems(keys: number[]): ITransferRPCModule[] {
      return this._getItems(keys).map((item: IRPCModule) => {
         const { dependent, dependencies }: IRPCModule = item;
         return {
            ...item,
            dependent: {
               [DependencyType.static]: _toArray(dependent.static),
               [DependencyType.dynamic]: _toArray(dependent.dynamic)
            },
            dependencies: {
               [DependencyType.static]: _toArray(dependencies.static),
               [DependencyType.dynamic]: _toArray(dependencies.dynamic)
            }
         };
      });
   }
   openSource(id: number): boolean {
      return this._modules.openSource(id);
   }
   /// region Query
   protected _getItems(keys?: number[]): IRPCModule[] {
      const modules = this._modules.getItems(keys);
      modules.forEach((module: IModule) => {
         this.__addFileId(module);
         this.__addDefined(module);
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
            const file = this._files.getItem(fileId as number) as IFile;
            const { size, path }: IFile = file;
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
               fileName: file.name
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
   /// region IUpdate
   private __updateItem(param: UpdateItemParam): boolean {
      const module = this._modules.getItem(param.id);
      if (!module) {
         return false;
      }
      if (Object.keys(param).length === 1) {
         return false;
      }
      const { fileName, size, path }: UpdateItemParam = param;
      if (!(fileName || size || path)) {
         return false;
      }
      const file = this._files.getItem(module.fileId as number);
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
   private __updateFileId(): void {
      const _keys = this._modules.query({
         where: { files: [Number.MIN_SAFE_INTEGER] }
      }).data;
      const modules = this._modules.getItems(_keys);
      modules.forEach(this.__addFileId.bind(this));
   }
   private __addFileId(module: IModule): void {
      if (module.fileId !== Number.MIN_SAFE_INTEGER) {
         return;
      }
      const fileName = getFileName(
         module.name,
         this._require.getOrigin(),
         isRelease(this._require.getConfig().buildMode),
         this._require.getConfig().bundles
      );
      const file: IFile =
         this._files.find(fileName) || this._files.create(fileName, 0);
      file.modules.add(module.id);
      module.fileId = file.id;
   }
   private __updateDefined(): void {
      this._modules.getItems().forEach(this.__addDefined.bind(this));
   }
   private __addDefined(module: IModule): void {
      if (!module.initialized) {
         module.initialized = this._require.getOrigin().defined(module.name);
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
   private __beforeQuery({
      where,
      sortBy
   }: Partial<IQueryParam<IRPCModule, IRPCModuleFilter>>): void {
      // Если фильтрация по файлам или сортировка по имени файла, то проставляем файлы модулям, у которых их нет
      if (
         (where &&
            ((where.files && where.files.length) ||
               (where.dependentOnFiles && where.dependentOnFiles.length))) ||
         (sortBy && typeof sortBy.fileName === 'boolean')
      ) {
         this.__updateFileId();
      }
      // Если сортировка по используемости модуля, то перепроверяем, что не пропустили
      if (sortBy && typeof sortBy.initialized === 'boolean') {
         this.__updateDefined();
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
   private __gitForFiles(files: number[]): number[] {
      return this._files
         .getItems(files)
         .map((file: IFile) => {
            return Array.from(file.modules);
         })
         .reduce((prev: number[], cur: number[]) => {
            return [...prev, ...cur];
         });
   }
   private __getDependentOnFiles(files: number[], keys?: number[]): number[] {
      return this._modules.query({
         keys,
         where: {
            dependentOnFiles: files
         }
      }).data;
   }
}
