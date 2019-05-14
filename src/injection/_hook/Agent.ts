import prepareForSerialization from './prepareForSerialization';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { DevtoolChannel } from '../_devtool/Channel';

class Agent {
   private elements: Map<IControlNode['id'], IControlNode> = new Map();
   private isDevtoolsOpened: boolean = false;
   private channel: DevtoolChannel = new DevtoolChannel('elements');

   constructor() {
      this.channel.addListener('devtoolsInitialized', this.__onDevtoolsOpened.bind(this));
      this.channel.addListener('inspectElement', (id) => {
         this.__inspectElement(id);
      });
      this.channel.addListener('viewTemplate', (id) => {
         this.__viewTemplate(id);
      });
   }

   private __onDevtoolsOpened(): void {
      this.isDevtoolsOpened = true;
      const data = [];

      this.elements.forEach((value) => {
         const {id, name, parentId}: IControlNode = value;
         data.push({id, name, parentId});
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
         case OperationType.REORDER:
            break;
         case OperationType.UPDATE:
            this.__handleUpdate(node);
            break;
      }
   }

   private __handleAdd(node: IControlNode): void {
      this.elements.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [OperationType.ADD, node.id, node.name];
         if (node.parentId) {
            message.push(node.parentId);
         }
         this.channel.dispatch('operation', message);
      }
   }

   private __handleUpdate(node: IControlNode): void {
      node.parentId = this.elements.get(node.id).parentId; //TODO: костыль, потому что при апдейте пока непонятно откуда брать parentId
      this.elements.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [OperationType.UPDATE, node.id];
         this.channel.dispatch('operation', message);
      }
   }

   private __handleRemove(node: IControlNode): void {
      this.elements.delete(node.id);
      this.__removeChildren(node.id);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [OperationType.REMOVE, node.id];
         this.channel.dispatch('operation', message);
      }
   }

   private __removeChildren(id: IControlNode['id']): void {
      const parents: Array<IControlNode['parentId']> = [];
      this.elements.forEach((element, key) => {
         if (element.parentId === id || parents.indexOf(element.parentId) !== -1) {
            this.elements.delete(key);
            parents.push(key);
            const message: IOperationEvent['args'] = [OperationType.REMOVE, key];
            this.channel.dispatch('operation', message);
         }
      });
   }

   private __inspectElement(id: IControlNode['id']): void {
      const node = this.elements.get(id);
      this.channel.dispatch('inspectedElement', prepareForSerialization({...node, container: null}));
   }

   private __viewTemplate(id: IControlNode['id']): void {
      window.__WASABY_DEV_HOOK__.__template = this.elements.get(id).template;
   }
}

export default Agent;
