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
      this.channel.addListener(
         'devtoolsInitialized',
         this.__onDevtoolsOpened.bind(this)
      );
      this.channel.addListener(
         'inspectElement',
         this.__inspectElement.bind(this)
      );
      this.channel.addListener('viewTemplate', this.__viewTemplate.bind(this));
      this.channel.addListener(
         'viewConstructor',
         this.__viewConstructor.bind(this)
      );
      this.channel.addListener(
         'viewContainer',
         this.__viewContainer.bind(this)
      );
      this.channel.addListener(
         'storeAsGlobal',
         this.__storeAsGlobal.bind(this)
      );
      this.channel.addListener(
         'getSelectedItem',
         this.__getSelectedItem.bind(this)
      );
      this.channel.addListener(
         'viewFunctionSource',
         this.__viewFunctionSource.bind(this)
      );
      this.channel.addListener(
         'highlightElement',
         this.__highlightElement.bind(this)
      );
      this.channel.addListener('hideOverlay', () => {
         this.__toggleSelectFromPage(false);
      });
   }

   private __onDevtoolsOpened(): void {
      this.isDevtoolsOpened = true;
      const data = [];

      this.elements.forEach((value) => {
         const { id, name, parentId }: IControlNode = value;
         data.push({ id, name, parentId });
      });

      this.channel.dispatch('setInitialTree', data);
   }

   handleOperation(operation: OperationType, node: IControlNode): void {
      switch (operation) {
         case OperationType.DELETE:
            this.__handleRemove(node);
            break;
         case OperationType.CREATE:
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
         const message: IOperationEvent['args'] = [
            OperationType.CREATE,
            node.id,
            node.name
         ];
         if (node.parentId) {
            message.push(node.parentId);
         }
         this.channel.dispatch('operation', message);
      }
   }

   private __handleUpdate(node: IControlNode): void {
      this.elements.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [
            OperationType.UPDATE,
            node.id
         ];
         this.channel.dispatch('operation', message);
      }
   }

   private __handleRemove(node: IControlNode): void {
      this.elements.delete(node.id);
      this.__removeChildren(node.id);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [
            OperationType.DELETE,
            node.id
         ];
         this.channel.dispatch('operation', message);
      }
   }

   private __removeChildren(id: IControlNode['id']): void {
      const parents: Array<IControlNode['parentId']> = [];
      this.elements.forEach((element, key) => {
         if (
            element.parentId === id ||
            parents.indexOf(element.parentId) !== -1
         ) {
            this.elements.delete(key);
            parents.push(key);
            const message: IOperationEvent['args'] = [
               OperationType.DELETE,
               key
            ];
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
               events: this.__getEvents(id),
               container: null,
               instance: null,
               isControl: !!node.instance
            })
         );
         this.channel.dispatch('longMessage');

         window.$wasaby = { ...node };
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

   private __viewContainer(id: IControlNode['id']): void {
      const node = this.elements.get(id);
      if (node && node.instance) {
         window.__WASABY_DEV_HOOK__.__container = node.instance._container;
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
      let currentProperty = path.pop();
      let value;
      if (currentProperty === 'events') {
         value = this.__getEvents(id);
      } else {
         value = this.elements.get(id)[currentProperty];
      }
      while (path.length) {
         currentProperty = path.pop();
         value = value[currentProperty];
      }
      return value;
   }

   private __highlightElement(id?: IControlNode['id']): void {
      if (!this.overlay) {
         this.overlay = new Overlay();
      }

      if (!id) {
         this.overlay.remove();
         return;
      }

      const node = this.elements.get(id);
      if (node && node.instance && node.instance._container) {
         this.overlay.inspect(node.instance._container, node.name);
      } else {
         this.overlay.remove();
      }
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
            if (
               this.previousSelectedItemId &&
               currentElement.controlNodes.find(
                  (node) => node.key === this.previousSelectedItemId
               )
            ) {
               return this.elements.get(this.previousSelectedItemId);
            }
            return this.elements.get(
               currentElement.controlNodes[
                  currentElement.controlNodes.length - 1
               ].key
            );
         }
         currentElement = currentElement.parentElement;
      }
      return;
   }

   private __getSelectedItem(): void {
      const node =
         this.__findControlByDomNode(window.__WASABY_DEV_HOOK__.$0) ||
         this.elements.values().next().value;
      if (node && this.previousSelectedItemId !== node.id) {
         this.channel.dispatch('setSelectedItem', node.id);
         this.previousSelectedItemId = node.id;
      }
   }

   private __getEvents(
      id: IControlNode['id']
   ): Record<string, Array<{ function: Function; arguments: unknown[] }>> {
      /*
      TODO: пока только для контролов, потому что я не имею доступа к контейнерам шаблонов
       */
      const node = this.elements.get(id);
      const events: Record<
         string,
         Array<{ function: Function; arguments: unknown[] }>
      > = {};
      if (
         node &&
         node.instance &&
         node.instance._container &&
         node.instance._container.eventProperties
      ) {
         Object.keys(node.instance._container.eventProperties).forEach(
            (key) => {
               events[key.slice(3)] = node.instance._container.eventProperties[
                  key
               ].map((handler) => {
                  if (handler.fn.control[handler.value]) {
                     return {
                        function: handler.fn.control[handler.value],
                        arguments: handler.args
                     };
                  } else {
                     return {
                        function: handler.fn,
                        arguments: handler.args
                     };
                  }
               });
            }
         );
      }
      return events;
   }
}

export default Agent;
