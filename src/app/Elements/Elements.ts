// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import template = require('wml!Elements/Elements');
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { ContentChannel } from 'Devtool/Event/ContentChannel';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType, ControlType } from 'Extension/Plugins/Elements/const';
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
           name?: IControlNode['name'];
           parentId?: IControlNode['parentId'];
           depth: number;
           controlType: ControlType
        }> = [];
   protected _channel: ContentChannel = new ContentChannel('elements');
   protected _highlightedElements: Set<IControlNode['id']> = new Set();
   protected _collapsedNodes: Set<IControlNode['id']> = new Set();
   protected _children: Record<IControlNode['id'], HTMLElement>;

   constructor() {
      super();
      this._channel.addListener('inspectedElement', (node: IControlNode) => {
         this._inspectedItem = retrocycle(node);
         if (this._children[node.id]) {
            this._children[node.id].scrollIntoView({
               block: 'nearest',
               inline: 'nearest'
            });
         }
      });
      this._channel.addListener('setSelectedItem', this.__selectElement.bind(this));
      this._channel.addListener('operation', this._operationHandler.bind(this));
      window.elementsPanel = this;
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

   protected _onItemClick(e: Event, item: IControlNode): void {
      this.__selectElement(item.id);
   }

   protected _operationHandler(args: IOperationEvent['args']): void {
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
      this._selectedItemId = id;
      this._channel.dispatch('inspectElement', this._selectedItemId);
   }

   private __removeNode(id: IControlNode['id']): void {
      const nodeIndex = this._elements.findIndex((node) => node.id === id);
      let deleteCount = 1;
      for (let i = nodeIndex; i < this._elements.length; i++) {
         if (this._elements[i].depth <= this._elements[nodeIndex].depth) {
            break;
         }
         deleteCount++;
      }
      this._elements.splice(nodeIndex, deleteCount);
   }

   private __addNode(
      id: IControlNode['id'],
      name: IControlNode['name'],
      controlType: ControlType,
      parentId?: IControlNode['parentId']
   ): void {
      if (this._elements.findIndex((node) => node.id === id) !== -1) {
         return; //TODO: Макс для корня постоянно стреляет CREATE, в итоге в _elements добавляется пачка одинаковых элементов
      }

      if (!parentId) {
         this._elements.push({
            id,
            name,
            parentId,
            controlType,
            depth: 0
         });
      } else {
         // TODO: сделать добавление в произвольное место
         const parentIndex = this._elements.findIndex((element) => element.id === parentId);
         let lastChildIndex = parentIndex + 1;
         if (parentIndex === -1) { //TODO: иногда ребёнок раньше родителя приходит, что-то не то. И зацикливания бывают, видимо неправильно беру parentId
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
            controlType,
            depth: this.__getDepth(parentId)
         });
      }
      this.__highlightNode(id);
   }

   private __highlightNode(id: IControlNode['id']): void {
      const elementIndex = this._elements.findIndex((element) => element.id === id);
      if (this.__isVisible(elementIndex, this._elements[elementIndex].depth)) {
         this._highlightedElements.add(id);
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

   private __getPath(node: IControlNode): IControlNode[] {
      const index = this._elements.indexOf(node);
      const path = [node];
      let currentDepth = node.depth;
      for (let i = index; i >= 0; i--) {
         if (this._elements[i].depth < currentDepth) {
            currentDepth--;
            path.push(this._elements[i]);
         }
      }
      return path.reverse();
   }
}

export default Elements;
