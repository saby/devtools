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

interface IOptions {
   store: Store;
}

class Elements extends Control {
   protected _template: Function = template;
   protected _selectedItemId: IControlNode['id'] | undefined;
   protected _inspectedItem: IControlNode | undefined;
   protected _collapsedNodes: Set<IControlNode['id']> = new Set();
   protected _children: Record<IControlNode['id'], HTMLElement>;
   protected _elementsChanged: boolean = false;
   protected _path: BreadcrumbsOptions['items'];
   protected _options: IOptions;
   protected _selectingFromPage: boolean = false;

   constructor(options: IOptions) {
      super();
      options.store.addListener('inspectedElement', (node: IControlNode) => {
         this._inspectedItem = retrocycle(node);
      });
      options.store.addListener('setSelectedItem', this.__selectElement.bind(this));
      options.store.addListener('operation', this._operationHandler.bind(this));
      options.store.addListener('stopSelectFromPage', this.__toggleSelectElementFromPage.bind(this));
      window.elementsPanel = this;
   }

   _beforeUpdate(newOptions: IOptions): void {
      //TODO: удалить после того как ключи будут браться из инферно
      if (this._elementsChanged) {
         const uniqueIds: Set<IControlNode['id']> = new Set();
         const elements = newOptions.store.getElements();
         const uniqueElements = elements.filter((element) => {
            if (uniqueIds.has(element.id)) {
               return false;
            }
            uniqueIds.add(element.id);
            return true;
         });
         newOptions.store.setElements(uniqueElements);
         this._elements = newOptions.store.getElements();
      }
   }

   _afterMount(): void {
      this._options.store.dispatch('devtoolsInitialized');
   }

   getSelectedItem(): void {
      chrome.devtools.inspectedWindow.eval('window.__WASABY_DEV_HOOK__.$0 = $0', () => {
         this._options.store.dispatch('getSelectedItem');
      });
   }

   hideOverlay(): void {
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
      this._elementsChanged = true;
      this._forceUpdate();
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
      this._path = this.__getPath(id);
      this._selectedItemId = id;
      this._options.store.dispatch('inspectElement', this._selectedItemId);
      if (this._children[id]) {
         this._children[id].scrollIntoView({
            block: 'nearest',
            inline: 'nearest'
         });
      }
   }

   private __highlightNode(id: IControlNode['id']): void {
      const elements = this._options.store.getElements();
      const elementIndex = elements.findIndex((element) => element.id === id);
      if (elementIndex !== -1 && this.__isVisible(elementIndex, elements[elementIndex].depth)) {
         if (this._children[id]) {
            highlightUpdate(this._children[id]);
         }
         this._forceUpdate();
      }
   }

   private __isVisible(index: number, startDepth: number): boolean {
      const elements = this._options.store.getElements();
      if (this._collapsedNodes.size > 0) {
         let currentDepth = startDepth;
         for (let i = index - 1; i >= 0; i--) {
            if (elements[i].depth < currentDepth) {
               currentDepth--;
               if (this._collapsedNodes.has(elements[i].id)) {
                  return false;
               }
            }
         }
      }
      return true;
   }

   private __toggleCollapsed(e: Event, id: IControlNode['id']): void {
      e.stopPropagation();
      if (this._collapsedNodes.has(id)) {
         this._collapsedNodes.delete(id);
      } else {
         this._collapsedNodes.add(id);
      }
      this._forceUpdate();
   }

   private __getPath(id: IControlNode['id']): BreadcrumbsOptions['items'] {
      const elements = this._options.store.getElements();
      const index = elements.findIndex((node) => node.id === id);
      if (index !== -1) {
         const node = elements[index];
         const path = [node];
         let currentDepth = node.depth;
         for (let i = index; i >= 0; i--) {
            if (elements[i].depth < currentDepth) {
               currentDepth--;
               path.push(elements[i]);
            }
         }
         return path.map((node) => {
            return {
               id: node.id,
               name: node.name,
               class: node.class
            };
         }).reverse();
      }
      throw new Error('Trying to find nonexistent item');
   }

   private __toggleSelectElementFromPage(): void {
      this._options.store.dispatch('toggleSelectFromPage', !this._selectingFromPage);
      this._selectingFromPage = !this._selectingFromPage;
   }
}

export default Elements;
