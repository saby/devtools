import {Control} from 'UI/Base';
import template = require('wml!Elements/_Elements/Elements');
import {
   IBackendControlNode,
   IFrontendControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOptions as BreadcrumbsOptions } from '../_Breadcrumbs/Breadcrumbs';
import { highlightUpdate } from '../_utils/highlightUpdate';
import Store from '../_store/Store';
import Model from './Model';
import { throttle } from 'Types/function';
import Controller from 'Search/Controller';
import { SyntheticEvent } from 'UICommon/Events';
import { InspectedElementPayload } from 'Types/ElementInspection';
import { hydrate } from '../_utils/hydrate';
import 'css!Elements/elements';

interface IOptions {
   store: Store;
   selected: boolean;
}

const ARROWS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
const SEARCH_THROTTLE_DURATION = 200;
const EVENT_NAME_OFFSET = -8;
const DEFAULT_EVAL_TIMEOUT = 100;
const BREAKPOINTS = 'window.__WASABY_DEV_HOOK__._breakpoints';
const MAX_INDENTATION_SIZE = 10;
const BREAKPOINT_ICON_WIDTH = 16;
const HINT_WIDTH = 69;
const DEFAULT_DETAILS_WIDTH = 300;

/**
 * Controller of the elements tab.
 * @author Зайцев А.С.
 */
class Elements extends Control {
   protected _template: Function = template;
   protected _selectedItemId: IFrontendControlNode['id'] | undefined;
   protected _inspectedItem: IBackendControlNode | undefined;
   protected _children: Record<IFrontendControlNode['id'], HTMLElement> & {
      list?: HTMLDivElement;
   };
   protected _path?: BreadcrumbsOptions['items'];
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

   protected _logicParentName: string = '';
   protected _logicParentId: IFrontendControlNode['logicParentId'];
   protected _logicParentHovered: boolean = false;

   protected _elementsWidths: WeakMap<HTMLElement, number> = new WeakMap();
   protected _listWidth: number = 0;
   protected _currentIndentationSize: number;

   protected _detailsWidth: number;

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

      options.store.toggleDevtoolsOpened(true);
      options.store.getFullTree().then((items) => {
         this._model.setItems(items);
      });
   }

   protected _beforeMount(): Promise<void> {
      return new Promise((resolve) => {
         chrome.storage.sync.get('elementsDetailsWidth', (result) => {
            if (result.elementsDetailsWidth) {
               this._detailsWidth = result.elementsDetailsWidth;
            } else {
               this._detailsWidth = DEFAULT_DETAILS_WIDTH;
            }
            resolve();
         });
      });
   }

   protected _afterMount(): void {
      this.panelVisibilityCallback = this.panelVisibilityCallback.bind(this);
      this._notify('subToPanelVisibility', [this.panelVisibilityCallback]);
      this.__updateIndentation = this.__updateIndentation.bind(this);
      this._notify('register', ['controlResize', this, this.__updateIndentation], {bubbling: true});
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (newOptions.selected && !this._options.selected) {
         const newElements = newOptions.store.getElements();
         this._model.setItems(newElements);
         const selectedIdFromStore = newOptions.store.getSelectedId();
         if (
            typeof selectedIdFromStore !== 'undefined' &&
            selectedIdFromStore !== this._selectedItemId &&
            newElements.find(({ id }) => id === selectedIdFromStore)
         ) {
            this.__selectElement(selectedIdFromStore, newOptions.store);
         } else {
            this.__inspectElement(newOptions.store);
         }
         this._throttledUpdateSearch();
         this._itemsChanged = false;
      }

      if (!newOptions.selected && this._options.selected) {
         this._options.store.dispatch('toggleSelectFromPage', false);
      }
   }

   protected _afterRender(): void {
      this.__updateIndentation();
   }

   protected _afterUpdate(): void {
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

   panelVisibilityCallback(isVisible: boolean): void {
      if (this._options.selected) {
         if (isVisible) {
            chrome.devtools.inspectedWindow.eval(
               'window.__WASABY_DEV_HOOK__.$0 = $0',
               () => {
                  this._options.store.dispatch('getSelectedItem');
               }
            );
         } else {
            this._options.store.dispatch('toggleSelectFromPage', false);
         }
      }
   }

   protected _beforeUnmount(): void {
      /*
      We don't have to remove subscriptions from the store here,
      because if any tab gets destroyed - the whole page gets destroyed, and the store is destroyed too.
       */
      this._options.store.dispatch('toggleSelectFromPage', false);
      this._inspectedItem = undefined;
      this._model.destructor();
      this._notify('unsubFromPanelVisibility', [this.panelVisibilityCallback]);
      this._notify('unregister', ['controlResize', this], {bubbling: true});
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
               if (this._selectedItemId === args[1]) {
                  this._inspectedItem = undefined;
                  this._selectedItemId = undefined;
                  this._path = undefined;
                  this._logicParentId = undefined;
                  this._logicParentName = '';
               }
               this.__removeBreakpoint(args[1]);
               break;
            case OperationType.REORDER:
               this._model.onOrderChanged();
               break;
         }
      }
   }

   protected _logicParentHoverChanged(e: Event, state: boolean): void {
      // TODO: можно и на странице подсвечивать потом
      this._logicParentHovered = state;
   }

   protected _onLogicParentClick(): void {
      // TODO: а тут сбрасывать подсветку на странице
      this.__selectElement(this._logicParentId as IFrontendControlNode['id']);
   }

   protected _offsetHandler(e: Event, offset: number): void {
      this._detailsWidth = this._detailsWidth + offset;
      chrome.storage.sync.set({
         elementsDetailsWidth: this._detailsWidth
      });
   }

   protected _onDetailsTabExpanded(
      e: Event,
      eventName:
         | '_optionsExpanded'
         | '_stateExpanded'
         | '_eventsExpanded'
         | '_attributesExpanded',
      value: boolean
   ): void {
      this[eventName] = value;
      if (value) {
         this.__inspectElement(this._options.store, {
            path: [eventName.slice(1, EVENT_NAME_OFFSET)]
         });
      }
   }

   protected _onSelectElementFromPageClick(): void {
      this.__toggleSelectElementFromPage();
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

   private __selectElement(
      id: IFrontendControlNode['id'],
      store: IOptions['store'] = this._options.store
   ): void {
      if (this._selectingFromPage) {
         this.__toggleSelectElementFromPage(store);
      }
      this._model.expandParents(id);
      this._path = this._model.getPath(id);
      this._selectedItemId = id;
      this._options.store.setSelectedId(id);
      const elements = store.getElements();
      const item = elements.find(
         (elem) => elem.id === id
      ) as IFrontendControlNode;
      if (
         typeof item.logicParentId !== 'undefined' &&
         item.parentId !== item.logicParentId
      ) {
         this._logicParentId = item.logicParentId;
         this._logicParentName = (elements.find(
            (elem) => elem.id === item.logicParentId
         ) as IFrontendControlNode).name;
      } else {
         this._logicParentId = undefined;
         this._logicParentName = '';
      }
      this._scrollToId = id;
      this.__inspectElement(store);
   }

   private __highlightNode(id: IFrontendControlNode['id']): void {
      if (this._model.isVisible(id) && this._children[id]) {
         highlightUpdate(this._children[id]);
      }
   }

   private __toggleExpanded(
      e: SyntheticEvent<MouseEvent>,
      id: IFrontendControlNode['id']
   ): void {
      e.stopPropagation();
      if (e.nativeEvent.altKey) {
         this._model.toggleExpandedRecursive(id);
      } else {
         this._model.toggleExpanded(id);
      }
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

   private __toggleSelectElementFromPage(
      store: IOptions['store'] = this._options.store
   ): void {
      store.dispatch('toggleSelectFromPage', !this._selectingFromPage);
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
         path
      }: {
         path?: Array<string | number>;
      } = {}
   ): void {
      store.dispatch('inspectElement', {
         id: this._selectedItemId,
         expandedTabs: this.__getVisibleTabs(),
         path
      });
   }

   private __setInspectedElement(payload: InspectedElementPayload): void {
      const { id } = payload;

      if (this._selectedItemId === id) {
         switch (payload.type) {
            case 'full':
               const { value: fullValue } = payload;
               const tabs: Array<
                  'attributes' | 'state' | 'options' | 'events'
               > = ['attributes', 'state', 'options', 'events'];
               tabs.forEach((field) => {
                  if (fullValue[field]) {
                     fullValue[field] = hydrate(
                        fullValue[field].data,
                        fullValue[field].cleaned
                     );
                  }
               });
               this._inspectedItem = {
                  ...fullValue,
                  id
               };
               break;
            case 'partial':
               const { value: partialValue } = payload;
               const changeableTabs: Array<
                  'changedAttributes' | 'changedState' | 'changedOptions'
               > = ['changedAttributes', 'changedState', 'changedOptions'];
               changeableTabs.forEach((field) => {
                  if (partialValue[field]) {
                     partialValue[field] = hydrate(
                        partialValue[field].data,
                        partialValue[field].cleaned
                     );
                  }
               });
               this._inspectedItem = {
                  ...this._inspectedItem,
                  ...partialValue,
                  id
               };
               break;
            case 'path':
               const { path, value: pathValue } = payload;
               if (path.length === 1) {
                  this._inspectedItem[path[0]] = hydrate(
                     pathValue.data,
                     pathValue.cleaned
                  );
                  this._inspectedItem = { ...this._inspectedItem };
               }
               break;
            case 'not-found':
               this._inspectedItem = undefined;
         }
      }
   }

   private __getVisibleTabs(): Array<
      'attributes' | 'state' | 'options' | 'events'
   > {
      const result: Array<'attributes' | 'state' | 'options' | 'events'> = [];
      if (this._optionsExpanded) {
         result.push('options');
      }
      if (this._stateExpanded) {
         result.push('state');
      }
      if (this._attributesExpanded) {
         result.push('attributes');
      }
      if (this._eventsExpanded) {
         result.push('events');
      }
      return result;
   }

   /**
    * We should always try to fit the widest child without overflowing.
    * Usually, the deepest child is also the widest, but it's not always the case.
    *
    * So, this function computes max indentation size for each child and then takes the
    * smallest indentation.
    * Because child's width is fixed, we can do this efficiently by caching the width of each child.
    *
    * There's one caveat. We don't make indentation larger unless the width of the panel increases.
    * If we did that, the items would move too often.
    * @private
    */
   private __updateIndentation(): void {
      // We don't need to do anything if the panel is hidden or if it doesn't have any items
      if (!this._options.selected || !this._children.list) {
         return;
      }

      const listWidth = this._children.list.clientWidth;

      // We should try to make indentation larger when the width of the panel increases
      if (listWidth > this._listWidth) {
         this._currentIndentationSize = MAX_INDENTATION_SIZE;
      }

      this._listWidth = listWidth;

      let maxIndentationSize = this._currentIndentationSize;

      for (const child of this._children.list.children) {
         const depth = parseInt(child.getAttribute('data-depth'), 10);

         let childWidth = this._elementsWidths.get(child);

         if (typeof childWidth === 'undefined') {
            childWidth =
               parseInt(
                  child.getElementsByClassName('js-devtools-Elements__name')[0]
                     .clientWidth,
                  10
               ) +
               BREAKPOINT_ICON_WIDTH +
               HINT_WIDTH;
            this._elementsWidths.set(child, childWidth);
         }

         const remainingWidth = Math.max(0, listWidth - childWidth);

         maxIndentationSize = Math.min(
            maxIndentationSize,
            remainingWidth / depth
         );
      }

      this._currentIndentationSize = maxIndentationSize;

      this._children.list.style.setProperty(
         '--indentation-size',
         `${maxIndentationSize}px`
      );
   }
}

export default Elements;
