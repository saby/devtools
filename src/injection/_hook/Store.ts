import { serialize } from './serialize';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { DevtoolChannel } from '../_devtool/Channel';

class Store {
   private elements: Map<IControlNode['id'], IControlNode> = new Map();
   private isDevtoolsOpened: boolean = false;
   private channel: DevtoolChannel = new DevtoolChannel('elements');

   constructor() {
      this.channel.addListener('devtoolsInitialized', this.__onDevtoolsOpened.bind(this));
      this.channel.addListener('inspectElement', (id) => {
         if (typeof id === 'number') {
            this.__inspectElement(id);
         }
      });
      this.channel.addListener('viewSource', (id) => {
         if (typeof id === 'number') {
            this.__viewSource(id);
         }
      });
   }

   /*
   Если тут будет работать медленно из-за сериализации, то можно попробовать ту схему из Augury:
   пушим сообщения в очередь -> говорим девтулзам что есть сообщения в очереди -> eval кода из очереди внутри девтулзов
    */
   private __onDevtoolsOpened(): void {
      this.isDevtoolsOpened = true;
      const data = [];

      this.elements.forEach((value) => {
         data.push(serialize({...value}));
      });

      this.channel.dispatch('setInitialTree', data);
   }

   handleOperation(operation: OperationType, node: IControlNode): void {
      switch (operation) {
         case OperationType.REMOVE:
            this.__handleRemove(node);
            break;
         case OperationType.ADD:
            this.__handleAdd(node);
            break;
      }
   }

   private __handleAdd(node: IControlNode): void {
      this.elements.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [OperationType.ADD, node.id, node.name];
         if (node.parentId) {
            message.push(node.parentId);
            message.push(node.key);
         }
         this.channel.dispatch('operation', message);
      }
   }

   private __handleRemove(node: IControlNode): void {
      this.elements.delete(node.id);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [OperationType.REMOVE, node.id];
         this.channel.dispatch('operation', message);
      }
   }

   //TODO: утащить эти методы из Store
   private __inspectElement(id: IControlNode['id']): void {
      const node = this.elements.get(id);
      this.channel.dispatch('inspectedElement', serialize({...node}));
   }

   private __viewSource(id: IControlNode['id']): void {
      //TODO: вообще непонятно как открывать файл. Общего у файлов только то, что у всех есть define
      window.__WASABY_DEV_HOOK__.__instance = this.elements.get(id).type;
   }
}

export default Store;
