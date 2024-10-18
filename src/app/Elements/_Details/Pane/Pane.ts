import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Elements/_Details/Pane/Pane';
import { descriptor, Model } from 'Types/entity';
import { Source } from './Source';
import * as columnTemplate from 'wml!Elements/_Details/Pane/columnTemplate';
import { highlightUpdate } from '../../_utils/highlightUpdate';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import './templates/StringTemplate';
import './templates/NumberTemplate';
import './templates/ObjectTemplate';
import './templates/BooleanTemplate';
import Store from '../../_store/Store';
import { TEMPLATES } from './const';
import 'css!Elements/elements';

type IOptions = IControlOptions & {
   caption: string;
   data: Record<string, unknown>;
   expanded: boolean;
   controlId: IFrontendControlNode['id'];
   isControl: boolean;
   store: Store;
   highlightUpdates?: boolean;
   changedData?: object;
   canStoreAsGlobal?: boolean;
} & {
   caption: 'Events';
   eventWithBreakpoint: string;
   elementsWithBreakpoints: Set<IFrontendControlNode['id']>;
};

enum ShowType {
   MENU,
   MENU_TOOLBAR,
   TOOLBAR
}

interface IItemAction {
   id: 'storeAsGlobal' | 'addBreakpoint' | 'removeBreakpoint';
   showType: ShowType;
   title: string;
   style?: string;
   handler?: (item: Model) => void;
   icon?: string;
   iconStyle?: string;
}

function getSource(
   initialData: IOptions['data'],
   store: IOptions['store'],
   controlId: IOptions['controlId'],
   root: string
): Source {
   return new Source({
      store,
      controlId,
      root,
      data: initialData
   });
}

function getPath(item: Model): string[] {
   return item.get('key').split('---').reverse();
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
      parent?: string | (string | null)[];
   } = {};
   protected _expandedItems: string[] = [];

   protected _beforeMount(options: IOptions): void {
      this._source = getSource(
         options.data,
         options.store,
         options.controlId,
         options.caption
      );
      this._columns = [
         {
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
            id: 'addBreakpoint',
            icon: 'icon-BigRemark',
            showType: ShowType.TOOLBAR,
            title: 'Add breakpoint',
            iconStyle: 'danger',
            handler: this.__setBreakpoint.bind(this)
         },
         {
            id: 'removeBreakpoint',
            icon: 'icon-BigRemarkNull',
            showType: ShowType.TOOLBAR,
            title: 'Remove breakpoint',
            iconStyle: 'danger',
            handler: this.__removeBreakpoint.bind(this)
         }
      ];
      this._visibilityCallback = this._itemActionVisibilityCallback.bind(this);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (
         newOptions.changedData &&
         this._options.changedData !== newOptions.changedData
      ) {
         this._source.update(newOptions.changedData);
      }
      if (needRecreateSource(this._options, newOptions)) {
         this._source = getSource(
            newOptions.data,
            newOptions.store,
            newOptions.controlId,
            newOptions.caption
         );
         this._filter = {};
         this._expandedItems = [];
      }
   }

   protected _afterUpdate(oldOptions: IOptions): void {
      if (
         this._options.highlightUpdates &&
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
      let needReload =
         this._options.eventWithBreakpoint !== oldOptions.eventWithBreakpoint;
      if (
         this._options.changedData &&
         this._options.changedData !== oldOptions.changedData
      ) {
         needReload = true;
      }
      if (needRecreateSource(oldOptions, this._options)) {
         needReload = false;
      }
      if (needReload && this._options.expanded && this._children.list) {
         this._children.list.reload();
      }
   }

   protected _itemActionVisibilityCallback(
      action: IItemAction,
      item: Model
   ): boolean {
      switch (action.id) {
         case 'storeAsGlobal':
            return (
               !!this._options.canStoreAsGlobal &&
               item.get('template') === TEMPLATES.object
            );
         case 'addBreakpoint':
            return (
               this._options.caption === 'Events' &&
               item.get('parent') === null &&
               (item.get('key') !== this._options.eventWithBreakpoint ||
                  !this._options.elementsWithBreakpoints.has(
                     this._options.controlId
                  ))
            );
         case 'removeBreakpoint':
            return (
               this._options.caption === 'Events' &&
               item.get('parent') === null &&
               item.get('key') === this._options.eventWithBreakpoint &&
               this._options.elementsWithBreakpoints.has(
                  this._options.controlId
               )
            );
      }
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

   private __setBreakpoint(item: Model): void {
      this._notify('setBreakpoint', [item.get('name')]);
   }

   private __removeBreakpoint(): void {
      this._notify('removeBreakpoint', [this._options.controlId]);
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         caption: descriptor(String).required(),
         data: descriptor(Object).required(),
         expanded: descriptor(Boolean).required(),
         controlId: descriptor(Number).required(),
         isControl: descriptor(Boolean).required(),
         store: descriptor(Store).required(),
         changedData: descriptor(Object, null),
         highlightUpdates: descriptor(Boolean),
         canStoreAsGlobal: descriptor(Boolean),
         elementsWithBreakpoints: descriptor(Set),
         eventWithBreakpoint: descriptor(String),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }

   static getDefaultOptions(): Partial<IOptions> {
      return {
         canStoreAsGlobal: true,
         highlightUpdates: true
      };
   }
}

function needRecreateSource(
   oldOptions: IOptions,
   newOptions: IOptions
): boolean {
   return (
      oldOptions.controlId !== newOptions.controlId ||
      oldOptions.caption !== newOptions.caption ||
      oldOptions.data !== newOptions.data
   );
}

Object.defineProperty(Pane, 'defaultProps', {
   enumerable: true,
   configurable: true,

   get(): object {
      return Pane.getDefaultOptions();
   }
});

export default Pane;
