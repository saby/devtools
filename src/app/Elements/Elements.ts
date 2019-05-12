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
        }>;
   protected _channel: ContentChannel = new ContentChannel('elements');

   constructor() {
      super();
      this._channel.addListener('inspectedElement', (node: IControlNode) => {
         this._inspectedItem = node;
      });
   }

   _afterMount(): void {
      this._channel.addListener('setInitialTree', (args: IControlNode[]) => {
         this._elements = args.slice();
         this.__selectElement(this._elements[0].id);
      });
      this._channel.addListener('operation', this._operationHandler.bind(this));
      this._channel.dispatch('devtoolsInitialized');
   }

   protected _beforeUnmount(): void {
      this._inspectedItem = undefined;
   }

   protected _onItemClick(e: Event, item: IControlNode): void {
      this.__selectElement(item.id);
   }

   protected _operationHandler(args: IOperationEvent['args']): void {
      switch (args[0]) {
         case OperationType.REMOVE:
            this.__removeNode(args[1]);
            break;
         case OperationType.ADD:
            if (args.length === 4) {
               this.__addNode(args[1], args[2], args[3]);
            }
            break;
      }
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
            parentId
         });
      } else {
         // TODO: сделать добавление в произвольное место
         let lastChildIndex = 0;
         for (let i = 0; i < this._elements.length; i++) {
            if (this._elements[i].parentId === parentId) {
               lastChildIndex = i;
            }
         }
         this._elements.splice(lastChildIndex + 1, 0, {
            id,
            name,
            parentId
         });
      }
   }
}

export default Elements;
