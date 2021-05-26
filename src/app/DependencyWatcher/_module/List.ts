import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import * as template from 'wml!DependencyWatcher/_module/List';
import { Model } from 'Types/entity';
import { IListItem, source } from '../data';
import { columns } from './column';
import { headers } from './header';
import { IRPCModuleFilter } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { IFilterItem, getButtonSource } from './getButtonSource';
import { getItemActions, IItemAction, ItemActionNames } from './getItemActions';
import { IColumn } from 'Controls/grid';
import { IHeaders } from '../interface/IHeaders';
import {
   INavigationOptionValue,
   IBasePageSourceConfig
} from 'Controls/interface';
import 'css!DependencyWatcher/module';

interface IChildren {
   listView: {
      reload: () => void;
   };
}

interface IOptions extends IControlOptions {
   source: source.ListAbstract;
   fileSource: source.File;
}

/**
 * Main list of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
export default class List extends Control<IOptions> {
   protected readonly _template: TemplateFunction = template;
   protected readonly _children: IChildren;
   protected readonly _column: IColumn[] = columns;
   protected readonly _headers: IHeaders<IListItem> = headers;
   protected readonly _navigation: INavigationOptionValue<IBasePageSourceConfig> = {
      source: 'page',
      view: 'infinity',
      sourceConfig: {
         pageSize: 70,
         page: 0
      }
   };
   protected _filterButtonSource: IFilterItem[];
   protected _filter?: source.IWhere<IRPCModuleFilter>;
   protected _root?: string;
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
               model.get('fileName')
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
               model.get('fileName')
            );
            this._setFilterValue('files');
            this._filterButtonSource = [...this._filterButtonSource];
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
   }

   protected _onFilterChanged(
      event: unknown,
      filter: source.IWhere<IRPCModuleFilter>
   ): void {
      this.__setFilter(filter);
   }

   protected _onItemsChanged(event: unknown, items: IFilterItem[]): void {
      this._filterButtonSource = items;
      // Filter doesn't know anything about textValue, so it can't reset it properly.
      const mutableFields = ['files', 'dependentOnFiles'];
      mutableFields.forEach((field) => {
         const item = this._filterButtonSource.find(
            ({ name }) => name === field
         );
         if (item) {
            item.visibility = true;
            if (Array.isArray(item.value) && !item.value.length) {
               item.textValue = '';
            }
         }
      });
   }

   protected _setFilterValue(
      id: keyof source.IWhere<IRPCModuleFilter>,
      value?: number[],
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
      item.visibility = true;
      return true;
   }
}
