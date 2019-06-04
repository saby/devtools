// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import template = require('wml!Elements/Elements');
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { ContentChannel } from 'Devtool/Event/ContentChannel';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType, ControlType } from 'Extension/Plugins/Elements/const';
import { IOptions as BreadcrumbsOptions } from './Breadcrumbs/Breadcrumbs';
import retrocycle from './retrocycle';
import 'css!Elements/Elements';

class Elements extends Control {
   protected _template: Function = template;
   protected _selectedItemId: IControlNode['id'] | undefined;
   protected _inspectedItem: IControlNode | undefined;
   // TODO: хранить в каком-то более адекватном виде
   protected _elements:
      | Array<{
           id: IControlNode['id'];
           name: IControlNode['name'];
           parentId?: IControlNode['parentId'];
           depth: number;
           class: string;
        }> = [];
   protected _channel: ContentChannel = new ContentChannel('elements');
   protected _highlightedElements: Set<IControlNode['id']> = new Set();
   protected _collapsedNodes: Set<IControlNode['id']> = new Set();
   protected _children: Record<IControlNode['id'], HTMLElement>;
   protected _elementsChanged: boolean = false;
   protected _path: BreadcrumbsOptions['items'];

   constructor() {
      super();
      this._channel.addListener('inspectedElement', (node: IControlNode) => {
         this._inspectedItem = retrocycle(node);
      });
      this._channel.addListener('setSelectedItem', this.__selectElement.bind(this));
      this._channel.addListener('operation', this._operationHandler.bind(this));
      window.elementsPanel = this;
   }

   _beforeUpdate(): void {
      //TODO: удалить после того как ключи будут браться из инферно
      if (this._elementsChanged) {
         const uniqueIds: Set<IControlNode['id']> = new Set();
         this._elements = this._elements.filter((element) => {
            if (uniqueIds.has(element.id)) {
               return false;
            }
            uniqueIds.add(element.id);
            return true;
         });
      }
   }

   _afterMount(): void {
      this._channel.dispatch('devtoolsInitialized');
   }

   getSelectedItem(): void {
      chrome.devtools.inspectedWindow.eval('window.__WASABY_DEV_HOOK__.$0 = $0', () => {
         this._channel.dispatch('getSelectedItem');
      });
   }

   hideOverlay(): void {
      this._channel.dispatch('hideOverlay');
   }

   protected _beforeUnmount(): void {
      this._channel.destructor();
      this._inspectedItem = undefined;
      this._elements = [];
      this._highlightedElements.clear();
      this._collapsedNodes.clear();
      window.elementsPanel = undefined;
   }

   protected _onItemClick(e: Event, id: IControlNode['id']): void {
      this.__selectElement(id);
   }

   protected _operationHandler(args: IOperationEvent['args']): void {
      this._elementsChanged = true;
      switch (args[0]) {
         case OperationType.DELETE:
            this.__removeNode(args[1]);
            break;
         case OperationType.UPDATE:
            this.__updateNode(args[1]);
            break;
         case OperationType.CREATE:
            this.__addNode(args[1], args[2], args[3], args[4]);
            break;
         case OperationType.REORDER:
            break;
      }
   }

   protected __updateNode(id: IControlNode['id']): void {
      if (this._selectedItemId === id) {
         this._channel.dispatch('inspectElement', this._selectedItemId);
      }
      this.__highlightNode(id);
   }

   protected _onAnimationEnd(e: Event, element: IControlNode): void {
      const nativeEvent = e.nativeEvent as AnimationEvent;
      if (nativeEvent.animationName === 'flash') {
         this._highlightedElements.delete(element.id);
         this._forceUpdate();
      }
   }

   private __getClassByControlType(controlType: ControlType): string {
      switch (controlType) {
         case ControlType.HOC:
            return 'Elements__node_hoc';
         case ControlType.CONTROL:
            return 'Elements__node_control';
         case ControlType.TEMPLATE:
            return 'Elements__node_template';
      }
   }

   private __highlightElement(e: Event, id?: IControlNode['id']): void {
      this._channel.dispatch('highlightElement', id);
   }

   private __selectElement(id: IControlNode['id']): void {
      this._path = this.__getPath(id);
      this._selectedItemId = id;
      this._channel.dispatch('inspectElement', this._selectedItemId);
      if (this._children[id]) {
         this._children[id].scrollIntoView({
            block: 'nearest',
            inline: 'nearest'
         });
      }
   }

   private __removeNode(id: IControlNode['id']): void {
      const nodeIndex = this._elements.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
         this._elements.splice(nodeIndex, 1);
      }
   }

   private __addNode(
      id: IControlNode['id'],
      name: IControlNode['name'],
      controlType: ControlType,
      parentId?: IControlNode['parentId']
   ): void {
      if (!parentId) {
         this._elements.push({
            id,
            name,
            parentId,
            class: this.__getClassByControlType(controlType),
            depth: 0
         });
      } else {
         // TODO: сделать добавление в произвольное место
         const parentIndex = this._elements.findIndex((element) => element.id === parentId);
         let lastChildIndex = parentIndex + 1;
         if (parentIndex === -1) {
            /**
             * TODO: иногда возникают циклические зависимости (пока такое встречалось только в попапах), и "родитель" приходит раньше "ребёнка"
             * Засовываем такие поддеревья в корень, чтобы хоть как-то их показать
             */
            lastChildIndex = 0;
         } else {
            while (this._elements[lastChildIndex] && this._elements[lastChildIndex].depth > this._elements[parentIndex].depth) {
               lastChildIndex++;
            }
         }
         this._elements.splice(lastChildIndex, 0, {
            id,
            name,
            parentId,
            class: this.__getClassByControlType(controlType),
            depth: this.__getDepth(parentId)
         });
      }
      this.__highlightNode(id);
   }

   private __highlightNode(id: IControlNode['id']): void {
      const elementIndex = this._elements.findIndex((element) => element.id === id);
      if (elementIndex !== -1 && this.__isVisible(elementIndex, this._elements[elementIndex].depth)) {
         this._highlightedElements.add(id);
         this._forceUpdate();
      }
   }

   private __getDepth(parentId?: IControlNode['parentId']): number {
      if (parentId) {
         const parent = this._elements.find((element) => element.id === parentId);
         if (parent) {
            return parent.depth + 1;
         }
      }
      return 0;
   }

   private __isVisible(index: number, startDepth: number): boolean {
      if (this._collapsedNodes.size > 0) {
         let currentDepth = startDepth;
         for (let i = index - 1; i >= 0; i--) {
            if (this._elements[i].depth < currentDepth) {
               currentDepth--;
               if (this._collapsedNodes.has(this._elements[i].id)) {
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
      const index = this._elements.findIndex((node) => node.id === id);
      if (index !== -1) {
         const node = this._elements[index];
         const path = [node];
         let currentDepth = node.depth;
         for (let i = index; i >= 0; i--) {
            if (this._elements[i].depth < currentDepth) {
               currentDepth--;
               path.push(this._elements[i]);
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
}

export default Elements;
