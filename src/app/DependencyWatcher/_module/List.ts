import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_module/List';
import { Model } from 'Types/entity';
import { RecordSet } from 'Types/collection';
import { IListItem, source } from '../data';
import { columns } from './column';
import { headers } from './header';
import { IRPCModuleFilter } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { IFilterItem, getButtonSource } from './getButtonSource';
import { getItemActions, IItemAction, ItemActionNames } from './getItemActions';
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
   protected _filterButtonSource: IFilterItem[];
   protected _filter?: source.IWhere<IRPCModuleFilter>;
   protected _root?: string;
   protected _searchValue?: string;
   protected _sorting?: object;
   protected _itemActions: IItemAction[];
   protected _dataLoadCallback: (items: RecordSet) => void;
   protected _filterChanged: boolean = false;
   constructor(options: IOptions) {
      super(options);
      this._filterButtonSource = getButtonSource({
         fileSource: options.fileSource
      });
      this.__setItemActions();
      this._dataLoadCallback = this.__dataLoadCallback.bind(this);
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
         },
         [ItemActionNames.dependentOnFile]: (model: Model) => {
            this.__setFilter({
               parent: undefined,
               files: [model.get('fileId')]
            });
            this._root = undefined;
         }
      });
   }

   private __setFilter(filter: source.IWhere<IRPCModuleFilter>): void {
      this._filter = { ...filter };
      if (this._filter.files && !this._filter.files.length) {
         delete this._filter.files;
      }
      if (
         this._filter.dependentOnFiles &&
         !this._filter.dependentOnFiles.length
      ) {
         delete this._filter.dependentOnFiles;
      }
      this._filterChanged = true;
   }

   protected _onFilterChanged(
      event: unknown,
      filter: source.IWhere<IRPCModuleFilter>
   ): void {
      this.__setFilter(filter);
   }
   protected _setFilterValue<T>(
      id: keyof source.IWhere<IRPCModuleFilter>,
      value?: T,
      textValue: string = ''
   ): boolean {
      const item = this._filterButtonSource.find(({ name }) => name === id);
      if (!item || value === item.value) {
         return false;
      }
      if (!value) {
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
   private __dataLoadCallback(items: RecordSet): void {
      if (this._filterChanged) {
         this._filterChanged = false;
         const keys: Array<keyof source.IWhere<IRPCModuleFilter>> = [
            'files',
            'dependentOnFiles'
         ];
         let updated = false;
         keys.forEach((key) => {
            if (
               this._filter &&
               this._filter[key] &&
               (this._filter[key] as number[]).length
            ) {
               const fileId = (this._filter[key] as number[])[0];
               const count = items.getCount();
               let item;
               for (let i = 0; i < count; i++) {
                  item = items.at(i);
                  if (item.get('fileId') === fileId) {
                     break;
                  }
               }
               if (item) {
                  const fileName = item.get('fileName');
                  const result = this._setFilterValue(key, [fileId], fileName);
                  if (result) {
                     updated = true;
                  }
               }
            } else {
               const result = this._setFilterValue(key);
               if (result) {
                  updated = true;
               }
            }
         });
         if (updated) {
            this._filterButtonSource = [...this._filterButtonSource];
         }
      }
   }
}
