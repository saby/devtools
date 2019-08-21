import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Elements/Details/Pane/Pane');
import { descriptor, Model } from 'Types/entity';
import { RecordSet } from 'Types/collection';
import { TEMPLATES } from './const';
import { Source } from './Source';
// @ts-ignore
import columnTemplate = require('wml!Elements/Details/Pane/columnTemplate');
import { highlightUpdate } from '../../highlightUpdate';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';

import 'css!Elements/Details/Pane/Pane';

interface IOptions extends IControlOptions {
   caption: string;
   data: object;
   expanded: boolean;
   controlId: IFrontendControlNode['id'];
   changedData?: object;
   canStoreAsGlobal?: boolean;
}

const enum ShowType {
   MENU,
   MENU_TOOLBAR,
   TOOLBAR
}

interface IItemAction {
   id: 'storeAsGlobal';
   showType: ShowType;
   title: string;
   style?: string;
   handler?: (item: Model) => void;
}

import './templates/StringTemplate';
import './templates/NumberTemplate';
import './templates/ObjectTemplate';
import './templates/BooleanTemplate';

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
            showType: ShowType.MENU,
            title: 'Store as global variable',
            handler: this.__storeAsGlobal.bind(this)
         }
      ];
      this._visibilityCallback = this._itemActionVisibilityCallback.bind(this);
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
      switch (action.id) {
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
      const path = item
         .get('key')
         .split('---')
         .reverse();
      if (this._options.canStoreAsGlobal) {
         this._notify('storeAsGlobal', [
            path.concat(this._options.caption.toLowerCase())
         ]);
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         caption: descriptor(String).required(),
         data: descriptor(Object).required(),
         expanded: descriptor(Boolean).required(),
         controlId: descriptor(Number).required(),
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
