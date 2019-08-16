// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import template = require('wml!Elements/Elements');
import {
   IBackendControlNode,
   IFrontendControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOptions as BreadcrumbsOptions } from './Breadcrumbs/Breadcrumbs';
import { highlightUpdate } from './highlightUpdate';
import retrocycle from './retrocycle';
import 'css!Elements/Elements';
import Store from './Store';
import Model from './Model';
import { throttle } from 'Types/function';
import Controller from 'Search/Controller';

interface IOptions {
   store: Store;
   selected: boolean;
}

const ARROWS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];

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

   protected _searchController: Controller = new Controller('name');

   protected _lastFoundItemIndex: number = 0;

   protected _searchTotal: number = 0;

   protected _throttledUpdateSearch: Function;

   protected _itemsChanged: boolean = false;

   protected _optionsExpanded: boolean = true;
   protected _stateExpanded: boolean = true;
   protected _eventsExpanded: boolean = false;
   protected _attributesExpanded: boolean = false;

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
      }, 200);
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
      if (this._scrollToId) {
         if (this._children[this._scrollToId]) {
            this._children[this._scrollToId].scrollIntoView({
               block: 'nearest',
               inline: 'nearest'
            });
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
      if (ARROWS.indexOf(key) !== -1 && this._selectedItemId) {
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
               break;
         }
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
      this._selectingFromPage = false;
      if (this._model.getVisibleItems().length > 0) {
         this._model.expandParents(id);
         this._path = this._model.getPath(id);
         this._selectedItemId = id;
         this._scrollToId = id;
         this.__inspectElement(this._options.store);
      }
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
               this._inspectedItem = retrocycle(node);
               break;
            case 'partial':
               const deserializedNode = retrocycle(node);
               Object.entries(deserializedNode).forEach(([key, value]) => {
                  if (key === 'id') {
                     return;
                  }
                  this._inspectedItem[key] = value;
                  this._forceUpdate();
               });
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
            newTab: value ? eventName.slice(1, -8) : undefined
         });
      }
   }
}

export default Elements;
