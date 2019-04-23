import { serialize } from './serialize';
import { IControlNode } from '../../interface/IControlNode';
import { OperationType } from '../RENAME/const';
import { Broadcast } from '../RENAME/Broadcast';

interface IOperationEvent {
   data: OperationPayload;
}

type OperationPayload =
   | [OperationType.REMOVE, IControlNode['id']]
   | [OperationType.ADD, IControlNode['id'], IControlNode['name']] //add root
   | [OperationType.ADD, IControlNode['id'], IControlNode['name'], IControlNode['parentId']]; //add leaf

class Store {
   private elementsTree: Map<IControlNode['id'], IControlNode> = new Map();
   private isDevtoolsOpened: boolean = false;
   private broadcast: Broadcast = new Broadcast('elements');

   constructor() {
      this.broadcast.addListener('devtoolsInitialized', () => {
         this.__onDevtoolsOpened();
      });
   }

   /*
   Если тут будет работать медленно из-за сериализации, то можно попробовать ту схему из Augury:
   пушим сообщения в очередь -> говорим девтулзам что есть сообщения в очереди -> eval кода из очереди внутри девтулзов
    */
   private __onDevtoolsOpened(): void {
      if (this.isDevtoolsOpened) {
         throw new Error('Trying to initialize elements tree, but the tree is already initialized.');
      }
      this.isDevtoolsOpened = true;
      const data = {};

      this.elementsTree.forEach((value, key) => {
         data[key] = serialize(value);
      });

      this.broadcast.dispatch('treeInitialization', data);
   }

   handleOperation(operation: OperationType, node: IControlNode): void {
      switch (operation) {
         case OperationType.ADD:
            this.__handleAdd(node);
            break;
         case OperationType.REMOVE:
            this.__handleRemove(node);
            break;
      }
   }

   private __handleAdd(node: IControlNode): void {
      this.elementsTree.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent = {
            data: [OperationType.ADD, node.id, node.name]
         };
         if (node.parentId) {
            message.data.push(node.parentId);
         }
         this.broadcast.dispatch('operation', message);
      }
   }

   private __handleRemove(node: IControlNode): void {
      this.elementsTree.delete(node.id);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent = {
            data: [OperationType.REMOVE, node.id]
         };
         this.broadcast.dispatch('operation', message);
      }
   }
}

export default Store;
