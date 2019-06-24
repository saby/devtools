import { Control, IControlOptions } from 'UI/Base';
// @ts-ignore
import template = require('wml!Elements/Details/Pane/Pane');
import { descriptor, Model } from 'Types/entity';
import { TEMPLATES } from './const';
import { Source } from './Source';
import columnTemplate = require('wml!Elements/Details/Pane/columnTemplate');
import { highlightUpdate } from '../../highlightUpdate';

import 'css!Elements/Details/Pane/Pane';

interface IOptions extends IControlOptions {
   caption: string;
   data: object;
   expanded: boolean;
   controlId: string;
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

// TODO: сделать это через async
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
   protected _template: Function = template;
   protected _source: Source;
   protected _columns: object[];
   protected _itemActions: IItemAction[];
   protected _visibilityCallback: (action: IItemAction, item: Model) => boolean;
   protected _listVersion: number = 0;

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
      if (this._options.data !== newOptions.data) {
         this._source = getSource(newOptions.data);
         this._listVersion++;
      }
   }

   protected _afterUpdate(oldOptions: IOptions): void {
      if (
         this._options.changedData &&
         this._options.changedData !== oldOptions.changedData &&
         this._options.controlId === oldOptions.controlId
      ) {
         /**
          * TODO: Подсветка изменившихся опций. Пока без учёта сортировки, фильтрации, виртуальный скролл и т.д.
          * Сделано через прямые манипуляции с DOM по двум причинам:
          * 1) Я не знаю какие элементы отрисованы в определённый момент. Действия должны производится только над видимыми элементами,
          * и если в списке есть виртуальный скролл, то понять какой элемент видим официально нельзя.
          * 2) Это быстрее. Другой вариант: вешать класс на элементы, который запустит анимацию. Подписаться на окончание анимации и снимать этот класс.
          * Такой вариант в худшем случае может вызывать N перерисовок, где N - количество изменившихся элементов. Также если элемент уничтожится за время
          * анимации, то он никогда не удалится из списка изменившихся.
          */
         const items = this._children.list._container.querySelectorAll(
            '.controls-GridViewV__itemsContainer .controls-Grid__row-cell'
         );
         const keys = Object.keys(this._options.data);
         Object.keys(this._options.changedData).forEach((key) => {
            let index = keys.indexOf(key);
            if (index !== -1 && items[index]) {
               highlightUpdate(items[index]);
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
         controlId: descriptor(String).required(),
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
