import { Module } from '../storage/Module';
import { DataSet, Query as TypesQuery } from 'Types/source';
import {
   IRPCModule,
   IRPCModuleFilter,
   IRPCModuleInfo,
   ITransferRPCModule
} from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import {
   IQueryParam,
   IQueryResult
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { IListItem } from '../IListItem';
import { IDependencies } from 'Extension/Plugins/DependencyWatcher/IModule';
import { Compatibility } from './Compatibility';
import { IWhere } from './list/IWhere';
import {
   DefaultFilters,
   getQueryParam,
   IgnoreFilters
} from './list/getQueryParam';
import { hasChildren } from './list/hasChildren';
import { GLOBAL_MODULE_NAME } from 'Extension/Plugins/DependencyWatcher/const';
import { queue } from 'Extension/Utils/queue';
import { RecordSet } from 'Types/collection';
import { IListConfig } from './IList';
import { ILogger } from 'Extension/Logger/ILogger';
import { Lang, revert } from 'Extension/Utils/kbLayout';
import * as hierarchyId from '../util/hierarchyId';

function filterGlobal(item: ITransferRPCModule): boolean {
   return item.name !== GLOBAL_MODULE_NAME;
}

/**
 * Base class for sources of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
export abstract class ListAbstract extends Compatibility {
   private _items: Module;
   private _defaultFilters: DefaultFilters<IRPCModuleFilter>;
   private _ignoreFilters: IgnoreFilters<IRPCModuleFilter>;
   private _logger: ILogger;
   constructor(config: IListConfig) {
      super(config);
      this._items = config.itemStorage;
      this._logger = config.logger;
      this._defaultFilters = config.defaultFilters || {};
      this._ignoreFilters = config.ignoreFilters || {};
   }

   query(query: TypesQuery): Promise<DataSet> {
      this._logger.log('start query');
      const queryParam = getQueryParam<IRPCModuleFilter>(
         query,
         this._ignoreFilters,
         this._defaultFilters
      );
      const {
         where
      }: IQueryParam<IRPCModuleFilter, IWhere<IRPCModuleFilter>> = queryParam;
      const parent = where.parent;
      let switchedStr: string | undefined;
      delete where.parent;
      return this.__callQuery(queryParam, parent)
         .then(({ data, hasMore }) => {
            // Если есть результат или строка поиска пустая, возвращаем как есть
            if (data.length || !where.name) {
               return { data, hasMore };
            }
            switchedStr = revert(where.name, Lang.ru, Lang.en);
            // если ничего не поменялось, то тоже возвращаем как есть
            if (switchedStr === where.name) {
               switchedStr = undefined;
               return { data, hasMore };
            }
            // Иначе попробуем перезапросить с изменённым языком строки поиска
            where.name = switchedStr;
            return this.__callQuery(queryParam, parent);
         })
         .then(({ data, hasMore }) => {
            this._logger.log('query success. create path');
            return this.__createPath(parent).then((path: RecordSet | void) => {
               this._logger.log('query success');
               return new DataSet({
                  rawData: {
                     data,
                     meta: {
                        more: hasMore,
                        path,
                        switchedStr
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               });
            });
         })
         .catch((error: Error) => {
            this._logger.error(error);
            throw error;
         });
   }

   private __callQuery(
      param: IQueryParam<IRPCModule, IRPCModuleFilter>,
      parent?: string | string[]
   ): Promise<IQueryResult<IListItem>> {
      if (!parent) {
         return this.__query(param);
      }

      if (Array.isArray(parent)) {
         return this.__queryItems(parent, param);
      }

      return this.__queryItem(hierarchyId.split(parent)[0], parent, param);
   }

   private __query(
      param: IQueryParam<IRPCModule, IRPCModuleFilter>
   ): Promise<IQueryResult<IListItem>> {
      this._logger.log('query without parent');
      let _hasMore: boolean;
      return this._items
         .query(param)
         .then(({ data, hasMore }) => {
            _hasMore = hasMore;
            return this._items.getItems(data);
         })
         .then((items: ITransferRPCModule[]) => {
            return {
               hasMore: _hasMore,
               data: items
                  .filter(filterGlobal)
                  .map((item) => this.__createItem(item))
            };
         });
   }

   private __queryItem(
      itemId: number,
      listItemId: string,
      param: IQueryParam<IRPCModule, IRPCModuleFilter>
   ): Promise<IQueryResult<IListItem>> {
      this._logger.log(`query with parent: ${listItemId}`);
      return this._items
         .getItems([itemId])
         .then(([item]: ITransferRPCModule[]) => {
            if (!item) {
               throw new Error('Не удалось получить данные узла');
            }
            const children = this._getChildren(item);
            let _hasMore: boolean;
            return this._items
               .query({
                  ...param,
                  keys: [...children.dynamic, ...children.static]
               })
               .then(({ data, hasMore }) => {
                  _hasMore = hasMore;
                  return this._items.getItems(data);
               })
               .then((items: ITransferRPCModule[]) => {
                  return {
                     hasMore: _hasMore,
                     data: items.map((module) =>
                        this.__createItem(
                           module,
                           listItemId,
                           children.dynamic.includes(module.id)
                        )
                     )
                  };
               });
         });
   }

   private __queryItems(
      parents: Array<string | undefined>,
      param: IQueryParam<IRPCModule, IWhere<IRPCModuleInfo>>
   ): Promise<IQueryResult<IListItem>> {
      this._logger.log(
         `query with parents: ${parents} (on update event called)`
      );
      const querySteps = parents.map((parent?: string) => {
         return () => {
            return this.__callQuery(param, parent);
         };
      });
      return queue(querySteps).then(
         (results: Array<IQueryResult<IListItem>>) => {
            return results.reduce((current, next) => {
               return {
                  hasMore: current.hasMore || next.hasMore,
                  data: [...current.data, ...next.data]
               };
            });
         }
      );
   }

   private __createItem(
      item: ITransferRPCModule,
      parent?: string,
      isDynamic: boolean = false
   ): IListItem {
      const {
         name,
         id,
         defined,
         initialized,
         fileName,
         fileId,
         path,
         isDeprecated
      }: ITransferRPCModule = item;
      return {
         name,
         defined,
         fileName,
         fileId,
         path,
         initialized,
         isDynamic,
         isDeprecated,
         parent: parent || null,
         itemId: id,
         id: hierarchyId.create(id, parent),
         hasChildren: hasChildren(this._getChildren(item))
      };
   }

   private __createPath(parent?: string | string[]): Promise<RecordSet | void> {
      if (!parent || Array.isArray(parent)) {
         return Promise.resolve();
      }
      const keys: number[] = hierarchyId.split(parent).reverse();
      const parents: Record<number, string> = {};
      for (let i = 0; i < keys.length; i++) {
         parents[keys[i]] = hierarchyId.create(keys[i], parents[keys[i - 1]]);
      }
      return this._items
         .getItems(keys)
         .then((items: ITransferRPCModule[]) => {
            const listItems: IListItem[] = [];
            for (let i = 0; i < items.length; i++) {
               const currentParent = listItems[i - 1];
               const item = this.__createItem(items[i], currentParent && currentParent.id);
               listItems.push(item);
            }
            return listItems;
         })
         .then((items: IListItem[]) => {
            return new RecordSet({ rawData: items, idProperty: 'id' });
         });
   }

   protected abstract _getChildren(
      item: ITransferRPCModule
   ): IDependencies<number[]>;
}
