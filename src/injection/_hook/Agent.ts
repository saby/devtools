import prepareForSerialization from './prepareForSerialization';
import debounce from 'Extension/Utils/debounce';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { DevtoolChannel } from '../_devtool/Channel';
import Overlay from './Overlay';

class Agent {
   private elements: Map<IControlNode['id'], IControlNode> = new Map();
   private isDevtoolsOpened: boolean = false;
   private channel: DevtoolChannel = new DevtoolChannel('elements');
   private overlay: Overlay;
   private previousSelectedItemId: IControlNode['id'] | undefined;
   private mouseMoveHandler?: (e: MouseEvent) => void;

   constructor() {
      this.channel.addListener('devtoolsInitialized', this.__onDevtoolsOpened.bind(this));
      this.channel.addListener('inspectElement', this.__inspectElement.bind(this));
      this.channel.addListener('viewTemplate', this.__viewTemplate.bind(this));
      this.channel.addListener('viewConstructor', this.__viewConstructor.bind(this));
      this.channel.addListener('storeAsGlobal', this.__storeAsGlobal.bind(this));
      this.channel.addListener('getSelectedItem', this.__getSelectedItem.bind(this));
      this.channel.addListener('viewFunctionSource', this.__viewFunctionSource.bind(this));
      this.channel.addListener('hideOverlay', () => {
         this.__toggleSelectFromPage(false);
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
      if (node) {
         window.__WASABY_DEV_HOOK__.pushMessage(
            'inspectedElement',
            prepareForSerialization({
               ...node,
               container: null,
               instance: null,
               isControl: !!node.instance
            })
         );
         this.channel.dispatch('longMessage');
      }
   }

   private __viewTemplate(id: IControlNode['id']): void {
      const node = this.elements.get(id);
      if (node) {
         window.__WASABY_DEV_HOOK__.__template = node.template;
      }
   }

   private __viewConstructor(id: IControlNode['id']): void {
      const node = this.elements.get(id);
      if (node && node.instance) {
         window.__WASABY_DEV_HOOK__.__constructor = node.instance.constructor;
      }
   }

   private __viewFunctionSource({
      id,
      path
   }: {
      id: IControlNode['id'];
      path: Array<string | number>;
   }): void {
      window.__WASABY_DEV_HOOK__.__function = this.__getValueByPath(id, path);
   }

   private __storeAsGlobal({
      id,
      path
   }: {
      id: IControlNode['id'];
      path: Array<string | number>;
   }): void {
      window.$tmp = this.__getValueByPath(id, path);
      console.log('$tmp = ', window.$tmp);
   }

   private __getValueByPath(
      id: IControlNode['id'],
      path: Array<string | number>
   ): unknown {
      const node = this.elements.get(id);
      let currentProperty = path.pop();
      let value = node[currentProperty];
      while (path.length) {
         currentProperty = path.pop();
         value = value[currentProperty];
      }
      return value;
   }

   private __toggleSelectFromPage(state: boolean): void {
      if (state) {
         if (!this.overlay) {
            this.overlay = new Overlay();
         }

         this.mouseMoveHandler = debounce((e: MouseEvent) => {
            const element = document.elementFromPoint(e.x, e.y);
            if (element) {
               this.overlay.inspect(element);
            }
         }, 50);

         window.addEventListener('mousemove', this.mouseMoveHandler);
      } else {
         if (this.overlay) {
            this.overlay.remove();
         }
         if (this.mouseMoveHandler) {
            window.removeEventListener('mousemove', this.mouseMoveHandler);
         }
      }
   }

   private __findControlByDomNode(element: Element): IControlNode | undefined {
      let currentElement = element;
      while (currentElement) {
         if (currentElement.controlNodes) {
            return this.elements.get(currentElement.controlNodes[currentElement.controlNodes.length - 1].key);
         }
         currentElement = currentElement.parentElement;
      }
      return;
   }

   private __getSelectedItem(): void {
      const node = this.__findControlByDomNode(window.__WASABY_DEV_HOOK__.$0) || this.elements.values().next().value;
      if (node && this.previousSelectedItemId !== node.id) {
         this.channel.dispatch('setSelectedItem', node.id);
         this.previousSelectedItemId = node.id;
      }
   }
}

export default Agent;
