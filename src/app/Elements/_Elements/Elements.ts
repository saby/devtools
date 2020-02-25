import Control = require('Core/Control');
import template = require('wml!Elements/_Elements/Elements');
import {
   IBackendControlNode,
   IFrontendControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOptions as BreadcrumbsOptions } from '../_Breadcrumbs/Breadcrumbs';
import { highlightUpdate } from '../_utils/highlightUpdate';
import retrocycle from '../retrocycle';
import Store from '../_store/Store';
import Model from './Model';
import { throttle } from 'Types/function';
import Controller from 'Search/Controller';

interface IOptions {
   store: Store;
   selected: boolean;
}

const ARROWS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
const SEARCH_THROTTLE_DURATION = 200;
const EVENT_NAME_OFFSET = -8;
const DEFAULT_EVAL_TIMEOUT = 100;
const BREAKPOINTS = 'window.__WASABY_DEV_HOOK__._breakpoints';

/**
 * Controller of the elements tab.
 * @author Зайцев А.С.
 */
class Elements extends Control {
   protected _template: Function = template;
   protected _selectedItemId: IFrontendControlNode['id'] | undefined;
   protected _inspectedItem: IBackendControlNode | undefined;
   protected _children: Record<IFrontendControlNode['id'], HTMLElement>;
   protected _path: BreadcrumbsOptions['items'];
   protected _options: IOptions;
   protected _selectingFromPage: boolean = false;
   protected _scrollToId?: IFrontendControlNode['id'];
   protected _model: Model = new Model();

   protected _searchValue: string = '';

   protected _searchController: Controller<'name'> = new Controller('name');

   protected _lastFoundItemIndex: number = 0;

   protected _searchTotal: number = 0;

   protected _throttledUpdateSearch: Function;

   protected _itemsChanged: boolean = false;

   protected _optionsExpanded: boolean = true;
   protected _stateExpanded: boolean = true;
   protected _eventsExpanded: boolean = false;
   protected _attributesExpanded: boolean = false;

   protected _elementsWithBreakpoints: Set<
      IFrontendControlNode['id']
   > = new Set();
   protected _eventWithBreakpoint: string = '';
   // TODO: удалить после https://online.sbis.ru/opendoc.html?guid=4e36b340-8098-4a12-b600-91e29fb1c62a
   protected _task1178532066: number = 0;

   constructor(options: IOptions) {
      super();
      options.store.addListener(
         'inspectedElement',
         this.__setInspectedElement.bind(this)
      );
      options.store.addListener(
         'setSelectedItem',
         this.__selectElement.bind(this)
      );
      options.store.addListener(
         'endSynchronization',
         this.__onEndSynchronization.bind(this)
      );
      options.store.addListener('operation', this._operationHandler.bind(this));
      options.store.addListener(
         'stopSelectFromPage',
         this.__toggleSelectElementFromPage.bind(this)
      );
      this._throttledUpdateSearch = throttle(() => {
         this.__updateSearch(this._searchValue);
      }, SEARCH_THROTTLE_DURATION);
      window.elementsPanel = this;

      options.store.toggleDevtoolsOpened(true);
      options.store.getFullTree().then((items) => {
         this._model.setItems(items);
      });
   }

   _beforeUpdate(newOptions: IOptions): void {
      if (newOptions.selected && !this._options.selected) {
         this._model.setItems(newOptions.store.getElements());
         this.__inspectElement(newOptions.store, {
            reset: true
         });
         this._throttledUpdateSearch();
         this._itemsChanged = false;
      }
   }

   _afterUpdate(): void {
      if (typeof this._scrollToId !== 'undefined') {
         const child = this._children[this._scrollToId] as HTMLElement;
         if (child) {
            const text = child.querySelector('.js-devtools-Elements__name');
            if (text) {
               text.scrollIntoView({
                  block: 'nearest',
                  inline: 'nearest'
               });
            }
         }
         this._scrollToId = undefined;
      }
   }

   panelShownCallback(): void {
      chrome.devtools.inspectedWindow.eval(
         'window.__WASABY_DEV_HOOK__.$0 = $0',
         () => {
            this._options.store.dispatch('getSelectedItem');
         }
      );
   }

   panelHiddenCallback(): void {
      this._options.store.dispatch('toggleSelectFromPage', false);
   }

   protected _beforeUnmount(): void {
      this._options.store.dispatch('toggleSelectFromPage', false);
      this._inspectedItem = undefined;
      this._model.destructor();
      window.elementsPanel = undefined;
   }

   protected _onItemClick(e: Event, id: IFrontendControlNode['id']): void {
      this.__selectElement(id);
   }

   protected _onListKeyDown(e: {
      nativeEvent: KeyboardEvent;
      stopPropagation: Event['stopPropagation'];
   }): void {
      const key = e.nativeEvent.key;
      if (
         ARROWS.indexOf(key) !== -1 &&
         typeof this._selectedItemId !== 'undefined'
      ) {
         e.stopPropagation();
         const visibleItems = this._model.getVisibleItems();
         const index = visibleItems.findIndex(
            (item) => item.id === this._selectedItemId
         );
         if (index !== -1) {
            const originalItem = visibleItems[index];
            switch (key) {
               case 'ArrowDown':
                  if (index !== visibleItems.length - 1) {
                     this.__selectElement(visibleItems[index + 1].id);
                  }
                  break;
               case 'ArrowLeft':
                  if (originalItem.isExpanded) {
                     this._model.toggleExpanded(originalItem.id, false);
                  } else if (typeof originalItem.parentId !== 'undefined') {
                     const parent = visibleItems.find(
                        (item) => item.id === originalItem.parentId
                     );
                     if (parent) {
                        this.__selectElement(parent.id);
                     }
                  }
                  break;
               case 'ArrowRight':
                  if (originalItem.hasChildren) {
                     if (originalItem.isExpanded) {
                        this.__selectElement(visibleItems[index + 1].id);
                     } else {
                        this._model.toggleExpanded(originalItem.id, true);
                     }
                  }
                  break;
               case 'ArrowUp':
                  if (index !== 0) {
                     this.__selectElement(visibleItems[index - 1].id);
                  }
                  break;
            }
         }
      }
   }

   protected _operationHandler(args: IOperationEvent['args']): void {
      if (this._options.selected) {
         switch (args[0]) {
            case OperationType.UPDATE:
               this.__updateNode(args[1]);
               break;
            case OperationType.CREATE:
               this.__highlightNode(args[1]);
               this._itemsChanged = true;
               break;
            case OperationType.DELETE:
               this._itemsChanged = true;
               this.__removeBreakpoint(args[1]);
               break;
            case OperationType.REORDER:
               this._model.onOrderChanged();
               break;
         }
      }
   }

   /**
    * Removes every breakpoint and adds new ones.
    * Because every breakpoint is set through eval, it is difficult to check which breakpoints should be left and which should be removed, so it's safer to remove them all and add them again.
    * @param e
    * @param eventName
    * @private
    */
   protected _setBreakpoint(e: Event, eventName: string): Promise<void> {
      const selectedItemId = this._selectedItemId as IFrontendControlNode['id'];
      return this._removeAllBreakpoints().then(() => {
         this._options.store.dispatch('setBreakpoint', {
            id: selectedItemId,
            eventName
         });
         setTimeout(() => {
            chrome.devtools.inspectedWindow.eval(
               `${BREAKPOINTS} ? ${BREAKPOINTS}.map(([handler, condition, id]) => {
                  debug(handler, condition);
                  return id;
               }) : []`,
               (result: Array<IFrontendControlNode['id']>) => {
                  result.push(selectedItemId);
                  if (
                     this._inspectedItem &&
                     result.includes(this._inspectedItem.id)
                  ) {
                     this.__updateEvents(eventName, true);
                  }
                  this._elementsWithBreakpoints = new Set(result);
                  this._eventWithBreakpoint = eventName;
                  this._task1178532066++;
               }
            );
         }, DEFAULT_EVAL_TIMEOUT);
      });
   }

   /**
    * Removes every breakpoint both on the backend and the frontend.
    * @private
    */
   protected _removeAllBreakpoints(): Promise<void> {
      return new Promise((resolve) => {
         chrome.devtools.inspectedWindow.eval(
            `${BREAKPOINTS} && ${BREAKPOINTS}.forEach(([handler]) => undebug(handler)); ${BREAKPOINTS} = undefined;`,
            () => {
               this.__updateEvents(this._eventWithBreakpoint, false);
               this._elementsWithBreakpoints = new Set();
               this._eventWithBreakpoint = '';
               this._task1178532066++;
               resolve();
            }
         );
      });
   }

   /**
    * Removes all breakpoints related to a control both on the backend and the frontend.
    * Should be used only when the control gets removed, otherwise there's a risk to leave the user with impossible to remove breakpoints.
    * This can happen when a control is subscribed to an event which starts on one of its children, not the root node of the control.
    * @param id
    * @private
    */
   private __removeBreakpoint(id: IFrontendControlNode['id']): Promise<void> {
      if (this._elementsWithBreakpoints.has(id)) {
         this.__updateEvents(this._eventWithBreakpoint, false);
         this._elementsWithBreakpoints.delete(id);
         this._elementsWithBreakpoints = new Set(this._elementsWithBreakpoints);
         this._task1178532066++;
         return new Promise((resolve) => {
            chrome.devtools.inspectedWindow.eval(
               `if(${BREAKPOINTS}) {
               const result = [];
             ${BREAKPOINTS} = ${BREAKPOINTS}.filter(([handler,, controlId, initiatorId]) => {
               const shouldBeRemoved = controlId === ${id} || initiatorId === ${id};
               if (shouldBeRemoved) {
                  result.push(controlId);
                  undebug(handler);
               }
               return !shouldBeRemoved;
            });
            result;
         };`,
               (result?: Array<IFrontendControlNode['id']>) => {
                  if (result) {
                     const hasChanges = result.reduce((res, deletedId) => {
                        return (
                           this._elementsWithBreakpoints.delete(deletedId) ||
                           res
                        );
                     }, false);
                     if (hasChanges) {
                        this._elementsWithBreakpoints = new Set(
                           this._elementsWithBreakpoints
                        );
                        this._task1178532066++;
                     }
                  }
                  resolve();
               }
            );
         });
      } else {
         return Promise.resolve();
      }
   }

   private __updateNode(id: IFrontendControlNode['id']): void {
      if (this._selectedItemId === id) {
         this.__inspectElement(this._options.store);
      }
      this.__highlightNode(id);
   }

   private __highlightElement(e: Event, id?: IFrontendControlNode['id']): void {
      this._options.store.dispatch('highlightElement', id);
   }

   private __selectElement(id: IFrontendControlNode['id']): void {
      if (this._selectingFromPage) {
         this.__toggleSelectElementFromPage();
      }
      this._model.expandParents(id);
      this._path = this._model.getPath(id);
      this._selectedItemId = id;
      this._scrollToId = id;
      this.__inspectElement(this._options.store, {
         reset: true
      });
   }

   private __highlightNode(id: IFrontendControlNode['id']): void {
      if (this._children[id]) {
         highlightUpdate(this._children[id]);
      }
   }

   private __toggleExpanded(e: Event, id: IFrontendControlNode['id']): void {
      e.stopPropagation();
      this._model.toggleExpanded(id);
   }

   private __onEndSynchronization(): void {
      if (this._options.selected) {
         this._model.setItems(this._options.store.getElements());

         if (this._itemsChanged) {
            this._throttledUpdateSearch();
         }
         this._itemsChanged = false;
      }
   }

   private __toggleSelectElementFromPage(): void {
      this._options.store.dispatch(
         'toggleSelectFromPage',
         !this._selectingFromPage
      );
      this._selectingFromPage = !this._selectingFromPage;
   }

   private __onSearchValueChanged(e: Event, value: string): void {
      this.__updateSearch(value);
   }

   private __updateSearch(value: string): void {
      const searchResult = this._searchController.updateSearch(
         this._options.store.getElements(),
         value,
         this._selectedItemId
      );

      if (searchResult.id) {
         this.__selectElement(searchResult.id);
      }
      this._lastFoundItemIndex = searchResult.index;
      this._searchTotal = searchResult.total;
   }

   private __onSearchKeydown(e: { nativeEvent: KeyboardEvent }): void {
      if (e.nativeEvent.key === 'Enter') {
         const searchResult = this._searchController.getNextItemId(
            this._searchValue,
            e.nativeEvent.shiftKey
         );

         if (searchResult.id) {
            this.__selectElement(searchResult.id);
         }
         this._lastFoundItemIndex = searchResult.index;
         this._searchTotal = searchResult.total;
      }
   }

   private __inspectElement(
      store: IOptions['store'],
      {
         newTab,
         reset
      }: {
         newTab?: string;
         reset?: boolean;
      } = {}
   ): void {
      store.dispatch('inspectElement', {
         id: this._selectedItemId,
         expandedTabs: this.__getVisibleTabs(),
         newTab,
         reset
      });
   }

   private __setInspectedElement({
      type,
      node
   }: {
      type: 'full' | 'partial';
      node: IBackendControlNode;
   }): void {
      if (this._selectedItemId === node.id) {
         switch (type) {
            case 'full':
               this._inspectedItem = updateInspectedItem(
                  retrocycle(node),
                  {},
                  this._eventWithBreakpoint,
                  this._elementsWithBreakpoints.has(node.id)
               );
               break;
            case 'partial':
               this._inspectedItem = updateInspectedItem(
                  retrocycle(node),
                  this._inspectedItem as object,
                  this._eventWithBreakpoint,
                  this._elementsWithBreakpoints.has(node.id)
               );
               break;
         }
      }
   }

   private __getVisibleTabs(): Array<'attributes' | 'state' | 'options'> {
      const result: Array<'attributes' | 'state' | 'options'> = [];
      if (this._optionsExpanded) {
         result.push('options');
      }
      if (this._stateExpanded) {
         result.push('state');
      }
      if (this._attributesExpanded) {
         result.push('attributes');
      }
      return result;
   }

   private __onDetailsTabExpanded(
      e: Event,
      eventName:
         | '_optionsExpanded'
         | '_stateExpanded'
         | '_eventsExpanded'
         | '_attributesExpanded',
      value: boolean
   ): void {
      this[eventName] = value;
      if (eventName !== '_eventsExpanded') {
         this.__inspectElement(this._options.store, {
            newTab: value ? eventName.slice(1, EVENT_NAME_OFFSET) : undefined
         });
      }
   }

   /**
    * This function is used only to add hasBreakpoint field to an event and trigger the update of the tab
    * @param eventName
    * @param hasBreakpoint
    * @private
    */
   private __updateEvents(eventName: string, hasBreakpoint: boolean): void {
      if (
         this._inspectedItem &&
         this._inspectedItem.events &&
         this._inspectedItem.events[eventName]
      ) {
         this._inspectedItem.changedEvents = {
            [eventName]: {
               ...this._inspectedItem.events[eventName],
               hasBreakpoint
            }
         };
         this._inspectedItem = { ...this._inspectedItem };
      }
   }

   static _theme: string[] = ['Elements/elements'];
}

/**
 * Merges the data from backend and current inspectedItem. Transforms every value for the consumption by details tab, adds information about breakpoints.
 * @param data
 * @param originalObject
 * @param eventName
 * @param needBreakpoint
 */
function updateInspectedItem(
   data: object,
   originalObject: object,
   eventName: string,
   needBreakpoint: boolean
): Elements['_inspectedItem'] {
   const result = { ...originalObject };

   Object.entries(data).forEach(([key, value]) => {
      if (key === 'id' || key === 'isControl') {
         result[key] = value;
         return;
      }
      const innerResult = {};
      Object.entries(value).forEach(([valueKey, valueValue]) => {
         innerResult[valueKey] = {
            value: valueValue
         };
         if (key === 'events' && eventName === valueKey) {
            innerResult[valueKey].hasBreakpoint = needBreakpoint;
         }
      });
      result[key] = innerResult;
   });

   return result;
}

export default Elements;
