import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_module/List';
import { Model } from 'Types/entity';
import { IListItem, source } from '../data';
import { columns } from './column';
import { headers } from './header';
import { IRPCModuleFilter } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { IFilterItem, getButtonSource } from './getButtonSource';
import {
   getItemActions,
   IItemAction,
   ItemActionNames,
   visibilityCallback
} from './getItemActions';
import { IColumn } from '../interface/IColumn';
import { IHeaders } from '../interface/IHeaders';

interface IChildren {
   listView: {
      reload: () => void;
   };
}

interface IOptions extends IControlOptions {
   source: source.ListAbstract;
   fileSource: source.File;
}

interface INavigation {
   source: 'page' | 'position';
   view: 'infinity' | 'pages' | 'demand';
   sourceConfig: {
      pageSize: number;
      page: number;
      mode: 'totalCount';
   };
}

export default class List extends Control<IOptions> {
   protected readonly _template: TemplateFunction = template;
   protected readonly _children: IChildren;
   protected readonly _column: Array<Partial<IColumn<IListItem>>> = columns;
   protected readonly _headers: IHeaders<IListItem> = headers;
   protected readonly _navigation: INavigation = {
      source: 'page',
      view: 'infinity',
      sourceConfig: {
         pageSize: 50,
         page: 0,
         mode: 'totalCount'
      }
   };
   protected readonly _itemActionVisibilityCallback: (
      action: IItemAction,
      model: Model
   ) => boolean = visibilityCallback;
   protected _filterButtonSource: IFilterItem[];
   protected _filter: source.IWhere<IRPCModuleFilter>;
   protected _root?: string;
   protected _searchValue?: string;
   protected _sorting?: object;
   protected _itemActions: IItemAction[];
   constructor(options: IOptions) {
      super(options);
      this._filterButtonSource = getButtonSource({
         fileSource: options.fileSource
      });
      this.__setItemActions();
   }
   reload(): void {
      if (this._children.listView) {
         this._children.listView.reload();
      }
   }
   private __setItemActions(): void {
      this._itemActions = getItemActions({
         [ItemActionNames.file]: (model: Model) => {
            this.__setFilter({
               parent: undefined,
               files: [model.get('fileId')]
            });
            this._root = undefined;
            this._setFilterValue(
               'files',
               [model.get('fileId')],
               `file: ${model.get('fileName')}`
            );
            this._setFilterValue('dependentOnFiles');
            this._filterButtonSource = [...this._filterButtonSource];
         },
         [ItemActionNames.dependentOnFile]: (model: Model) => {
            this.__setFilter({
               parent: undefined,
               files: [model.get('fileId')]
            });
            this._root = undefined;
            this._setFilterValue(
               'dependentOnFiles',
               [model.get('fileId')],
               `depend on: ${model.get('fileName')}`
            );
            this._setFilterValue('files');
            this._filterButtonSource = [...this._filterButtonSource];
         }
      });
   }

   private __setFilter(filter: source.IWhere<IRPCModuleFilter>): void {
      const id = Math.random();
      this._filter = {
         ...filter,
         getVersion(): number {
            return id;
         }
      };
   }

   protected _filterChanged(
      event: unknown,
      filter: source.IWhere<IRPCModuleFilter>
   ): void {
      // TODO 86d9e478a7d3 - очистка значений, которые внесли руками в FilterButtonSource при изменении фильтра
      const keys: Array<keyof source.IWhere<IRPCModuleFilter>> = [
         'files',
         'dependentOnFiles'
      ];
      const updated = keys.some((resetId) => {
         if (
            filter.hasOwnProperty(resetId) &&
            Array.isArray(filter[resetId]) &&
            (filter[resetId] as number[]).length
         ) {
            return false;
         }
         return this._setFilterValue(resetId);
      });
      if (updated) {
         this._filterButtonSource = [...this._filterButtonSource];
      }
   }
   protected _setFilterValue<T>(
      id: keyof source.IWhere<IRPCModuleFilter>,
      value?: T,
      textValue: string = ''
   ): boolean {
      // TODO 86d9e478a7d3 - прокидывание данных в items внутри filterButtonSource
      const item = this._filterButtonSource.find(({ name }) => name === id);
      if (!item || value === item.value) {
         return false;
      }
      if (!value) {
         // reset
         if (
            item.value === item.resetValue ||
            (Array.isArray(item.value) && !item.value.length)
         ) {
            return false;
         }
      }
      item.value = value || item.resetValue;
      item.textValue = textValue;
      return true;
   }
}
/*
 * TODO 86d9e478a7d3
 *  Костыль для прокидывания поля фильтрации в filter.Controller > filter.Button сверху
 *  В текущей реализации он либо не отрисует значение фильтра, либо затрёт значение, т.к. оно выставлено не самим фильтром
 *  (в зависимости от параметров FilterButtonSource)
 *  Убрать после задачи:
 *  https://online.sbis.ru/opendoc.html?guid=bdbdae9b-a626-42a7-bda8-86d9e478a7d3
 */
