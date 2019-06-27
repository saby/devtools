// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import template = require('wml!Elements/Elements');
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOptions as BreadcrumbsOptions } from './Breadcrumbs/Breadcrumbs';
import { highlightUpdate } from './highlightUpdate';
import retrocycle from './retrocycle';
import 'css!Elements/Elements';
import Store from './Store';
import Model from './Model';

interface IOptions {
   store: Store;
   selected: boolean;
}

class Elements extends Control {
   protected _template: Function = template;
   protected _selectedItemId: IControlNode['id'] | undefined;
   protected _inspectedItem: IControlNode | undefined;
   protected _collapsedNodes: Set<IControlNode['id']> = new Set();
   protected _children: Record<IControlNode['id'], HTMLElement>;
   protected _path: BreadcrumbsOptions['items'];
   protected _options: IOptions;
   protected _selectingFromPage: boolean = false;
   protected _tabShown: boolean = false;
   private _scrollToId: IControlNode['id'];
   protected _model: Model = new Model();

   constructor(options: IOptions) {
      super();
      options.store.addListener('inspectedElement', (node: IControlNode) => {
         this._inspectedItem = retrocycle(node);
      });
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
      window.elementsPanel = this;
   }

   _afterMount(): void {
      this._options.store.dispatch('devtoolsInitialized');
      /**
       * TODO: обычно данные синхронизируются с каждой синхронизацией. Но при первом открытии это не работает
       * Тут я дожидаюсь пока прилетят элементы и потом забираю текущее состояние. Это очень плохое решение, стор сам
       * должен говорить когда нужно забирать элементы.
       */
      setTimeout(() => {
         this._model.setItems(this._options.store.getElements());
      }, 100);
   }

   _afterUpdate(): void {
      if (this._scrollToId) {
         if (this._children[this._scrollToId]) {
            this._children[this._scrollToId].scrollIntoView({
               block: 'nearest',
               inline: 'nearest'
            });
         }
         this._scrollToId = '';
      }
   }

   panelShownCallback(): void {
      this._tabShown = true;
      chrome.devtools.inspectedWindow.eval(
         'window.__WASABY_DEV_HOOK__.$0 = $0',
         () => {
            this._options.store.dispatch('getSelectedItem');
         }
      );
   }

   panelHiddenCallback(): void {
      this._tabShown = false;
      this._options.store.dispatch('toggleSelectFromPage', false);
   }

   protected _beforeUnmount(): void {
      this._options.store.dispatch('toggleSelectFromPage', false);
      this._inspectedItem = undefined;
      this._collapsedNodes.clear();
      window.elementsPanel = undefined;
   }

   protected _onItemClick(e: Event, id: IControlNode['id']): void {
      this.__selectElement(id);
   }

   protected _operationHandler(args: IOperationEvent['args']): void {
      switch (args[0]) {
         case OperationType.UPDATE:
            this.__updateNode(args[1]);
            break;
         case OperationType.CREATE:
            this.__highlightNode(args[1]);
            break;
      }
   }

   private __updateNode(id: IControlNode['id']): void {
      // TODO: если вкладка закрыта, то делать это не надо, но пока сложно отказаться
      if (this._selectedItemId === id) {
         this._options.store.dispatch('inspectElement', this._selectedItemId);
      }
      this.__highlightNode(id);
   }

   private __highlightElement(e: Event, id?: IControlNode['id']): void {
      this._options.store.dispatch('highlightElement', id);
   }

   private __selectElement(id: IControlNode['id']): void {
      this._selectingFromPage = false;
      if (this._model.getVisibleItems().length > 0) {
         this._model.expandParents(id);
         this._path = this._model.getPath(id);
         this._selectedItemId = id;
         this._scrollToId = id;
         this._options.store.dispatch('inspectElement', this._selectedItemId);
      }
   }

   private __highlightNode(id: IControlNode['id']): void {
      if (this._tabShown && this._options.selected) {
         if (this._children[id]) {
            highlightUpdate(this._children[id]);
         }
      }
   }

   private __toggleExpanded(e: Event, id: IControlNode['id']): void {
      e.stopPropagation();
      this._model.toggleExpanded(id);
   }

   private __onEndSynchronization(): void {
      this._model.setItems(this._options.store.getElements());
   }

   private __toggleSelectElementFromPage(): void {
      this._options.store.dispatch(
         'toggleSelectFromPage',
         !this._selectingFromPage
      );
      this._selectingFromPage = !this._selectingFromPage;
   }
}

export default Elements;
