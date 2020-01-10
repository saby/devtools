import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import template = require('wml!Elements/_Details/Pane/Pane');
import { descriptor, Model } from 'Types/entity';
import { RecordSet } from 'Types/collection';
import { TEMPLATES } from './const';
import { Source } from './Source';
import columnTemplate = require('wml!Elements/_Details/Pane/columnTemplate');
import { highlightUpdate } from '../../_utils/highlightUpdate';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import './templates/StringTemplate';
import './templates/NumberTemplate';
import './templates/ObjectTemplate';
import './templates/BooleanTemplate';

import 'css!Elements/elements';

interface IOptions extends IControlOptions {
   caption: string;
   data: object;
   expanded: boolean;
   controlId: IFrontendControlNode['id'];
   isControl: boolean;
   changedData?: object;
   canStoreAsGlobal?: boolean;
}

const enum ShowType {
   MENU,
   MENU_TOOLBAR,
   TOOLBAR
}

interface IItemAction {
   id: 'storeAsGlobal' | 'editValue' | 'revertValue';
   showType: ShowType;
   title: string;
   style?: string;
   handler?: (item: Model) => void;
   icon?: string;
}

interface IEditingConfig {
   sequentialEditing: boolean;
   toolbarVisibility: boolean;
}

function getSource(initialData: IOptions['data']): Source {
   const data = Object.entries(initialData).map(([key, value]) => {
      return {
         key,
         value,
         name: key,
         parent: null
      };
   });
   return new Source({
      data,
      idProperty: 'key',
      parentProperty: 'parent'
   });
}

function getPath(item: Model): string[] {
   return item
      .get('key')
      .split('---')
      .reverse();
}

function getEditingConfig(isControl: boolean): IEditingConfig | undefined {
   return isControl
      ? {
           sequentialEditing: false,
           toolbarVisibility: true
        }
      : undefined;
}

/**
 * Shows a list and a caption for a portion of the details pane.
 * @author Зайцев А.С.
 */
class Pane extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _source: Source;
   protected _columns: object[];
   protected _itemActions: IItemAction[];
   protected _visibilityCallback: (action: IItemAction, item: Model) => boolean;
   protected _filter: {
      name?: string;
      parent?: string | Array<string | null>;
   } = {};
   protected _editingConfig?: IEditingConfig;
   protected _editingItem?: Model;

   protected _beforeMount(options: IOptions): void {
      this._source = getSource(options.data);
      this._columns = [
         {
            getTemplate: this.__getTemplate,
            template: columnTemplate
         }
      ];
      this._itemActions = [
         {
            id: 'storeAsGlobal',
            icon: 'icon-Copy',
            showType: ShowType.MENU_TOOLBAR,
            title: 'Store as global variable',
            handler: this.__storeAsGlobal.bind(this)
         },
         {
            id: 'editValue',
            icon: 'icon-Edit',
            showType: ShowType.MENU_TOOLBAR,
            title: 'Edit',
            handler: this.__editValue.bind(this)
         },
         {
            id: 'revertValue',
            icon: 'icon-Undo2',
            showType: ShowType.MENU_TOOLBAR,
            title: 'Reset',
            handler: this.__revertValue.bind(this)
         }
      ];
      this._visibilityCallback = this._itemActionVisibilityCallback.bind(this);
      this._editingConfig = getEditingConfig(options.isControl);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (
         newOptions.changedData &&
         this._options.changedData !== newOptions.changedData
      ) {
         const rawData = Object.entries(newOptions.changedData).map(
            ([key, value]) => {
               return {
                  key,
                  value,
                  name: key,
                  parent: null
               };
            }
         );
         this._source.update(
            new RecordSet({
               rawData
            })
         );
         if (newOptions.expanded && this._children.list) {
            this._children.list.reload();
         }
      }
      if (this._options.data !== newOptions.data) {
         this._source = getSource(newOptions.data);
      }
      if (this._options.isControl !== newOptions.isControl) {
         this._editingConfig = getEditingConfig(newOptions.isControl);
      }
   }

   protected _afterUpdate(oldOptions: IOptions): void {
      if (
         this._options.changedData &&
         this._options.changedData !== oldOptions.changedData
      ) {
         Object.keys(this._options.changedData).forEach((key) => {
            const child = this._children[key] as Control;
            if (child && child._container.parentElement) {
               /**
                * Update highlighting uses direct DOM manipulation for 2 reasons:
                * 1) I don't know which elements are displayed at any given moment and in which order.
                * 2) This is faster. Another option was to add class to changed elements then subscribe
                * to "animationend" event and remove this class. That option could cause N synchronizations,
                * where N is a number of changed elements.
                * And any element could get removed during animation, so it will be never removed from changed elements.
                */
               highlightUpdate(child._container.parentElement);
            }
         });
      }
   }

   protected _itemActionVisibilityCallback(
      action: IItemAction,
      item: Model
   ): boolean {
      const value = item.get('value');
      if (item === this._editingItem) {
         return false;
      }
      switch (action.id) {
         // TODO: отключил эти 2 операции пока не разобрался с редактированием
         case 'editValue':
            return false;
         case 'revertValue':
            return false;
         case 'storeAsGlobal':
            return (
               !!this._options.canStoreAsGlobal &&
               value &&
               typeof value === 'object'
            );
      }
   }

   private __getTemplate(value: unknown): string {
      const type = typeof value;
      if (TEMPLATES.hasOwnProperty(type)) {
         return TEMPLATES[type];
      }
      return TEMPLATES.string;
   }

   private __toggleExpanded(): void {
      this._notify('expandedChanged', [!this._options.expanded]);
   }

   private __viewFunctionSource(e: Event, path: string[]): void {
      e.stopPropagation();
      this._notify('viewFunctionSource', [
         path.concat(this._options.caption.toLowerCase())
      ]);
   }

   private __storeAsGlobal(item: Model): void {
      const path = getPath(item);
      if (this._options.canStoreAsGlobal) {
         this._notify('storeAsGlobal', [
            path.concat(this._options.caption.toLowerCase())
         ]);
      }
   }

   private __beforeBeginEdit(e: Event, { item }: { item: Model }): void {
      this._editingItem = item;
   }

   private __beforeEndEdit(e: Event, item: Model, commit: boolean): void {
      /**
       * TODO: перейти на событие afterEndEdit после выполнения задачи:
       * https://online.sbis.ru/opendoc.html?guid=a17c70e8-0cbf-4685-bfd1-423bba9ef3d4
       */
      if (commit) {
         this._notify('setNodeOption', [getPath(item), item.get('value')]);
         this._editingItem = undefined;
      }
   }

   private __editValue(item: Model): void {
      this._children.list.beginEdit({
         item
      });
   }

   private __revertValue(item: Model): void {
      item.rejectChanges(item.getChanged());
      this._notify('revertNodeOption', [getPath(item)]);
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         caption: descriptor(String).required(),
         data: descriptor(Object).required(),
         expanded: descriptor(Boolean).required(),
         controlId: descriptor(Number).required(),
         isControl: descriptor(Boolean).required(),
         changedData: descriptor(Object, null),
         canStoreAsGlobal: descriptor(Boolean),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }

   static getDefaultOptions(): Partial<IOptions> {
      return {
         canStoreAsGlobal: true
      };
   }
}

export default Pane;
