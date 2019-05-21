// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import template = require('wml!Elements/Elements');
// @ts-ignore
import { descriptor } from 'Types/entity';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { ContentChannel } from 'Devtool/Event/ContentChannel';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType } from 'Extension/Plugins/Elements/const';
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
        }> = [];
   protected _channel: ContentChannel = new ContentChannel('elements');
   protected _highlightedElements: Set<IControlNode['id']> = new Set();

   constructor() {
      super();
      this._channel.addListener('inspectedElement', (node: IControlNode) => {
         this._inspectedItem = retrocycle(node);
      });
      this._channel.addListener('setInitialTree', (args: IControlNode[]) => {
         args.forEach((element) => {
            this.__addNode(element.id, element.name, element.parentId);
         });
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
      this._inspectedItem = undefined;
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
            this.__highlightNode(args[1]);
            break;
         case OperationType.CREATE:
            if (args.length === 4) {
               this.__addNode(args[1], args[2], args[3]);
            }
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

   private __highlightElement(e: Event, id?: IControlNode['id']): void {
      this._channel.dispatch('highlightElement', id);
   }

   private __selectElement(id: IControlNode['id']): void {
      this._selectedItemId = id;
      this._channel.dispatch('inspectElement', this._selectedItemId);
   }

   private __removeNode(id: IControlNode['id']): void {
      const nodeIndex = this._elements.findIndex((node) => node.id === id);
      this._elements.splice(nodeIndex, 1);
   }

   private __addNode(
      id: IControlNode['id'],
      name: IControlNode['name'],
      parentId?: IControlNode['parentId']
   ): void {
      if (!parentId) {
         this._elements.push({
            id,
            name,
            parentId,
            depth: 0
         });
      } else {
         // TODO: сделать добавление в произвольное место
         const parentIndex = this._elements.findIndex((element) => element.id === parentId);
         let lastChildIndex = parentIndex + 1;
         if (parentIndex === -1) { //TODO: иногда ребёнок раньше родителя приходит, что-то не то. И зацикливания бывают, видимо неправильно беру parentId
            lastChildIndex = 0;
         } else {
            while (this._elements[lastChildIndex] && this._elements[lastChildIndex].parentId === parentId) {
               lastChildIndex++;
            }
         }
         this._elements.splice(lastChildIndex, 0, {
            id,
            name,
            parentId,
            depth: this.__getDepth(parentId)
         });
      }
      this.__highlightNode(id);
   }

   private __highlightNode(id: IControlNode['id']): void {
      this._highlightedElements.add(id);
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
}

export default Elements;
