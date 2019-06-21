import prepareForSerialization from './prepareForSerialization';
import debounce from 'Extension/Utils/debounce';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { DevtoolChannel } from '../_devtool/Channel';
import Overlay from './Overlay';
import { guid } from 'Extension/Utils/guid';

interface IChangedNode {
   node: IControlNode;
   operation: OperationType;
   selfStartTime: number;
   selfDuration: number;
}

class Agent {
   private elements: Map<IControlNode['id'], IControlNode> = new Map();

   private changedRoots: Map<
      IControlNode['id'],
      Map<IControlNode['id'], IChangedNode>
   > = new Map();

   private changedNodesBySynchronization: Map<
      string,
      Map<IControlNode['id'], IChangedNode>
   > = new Map();

   private rootStack: Array<IControlNode['id']> = [];

   private isDevtoolsOpened: boolean = false;

   private isProfiling: boolean = false;

   private channel: DevtoolChannel = new DevtoolChannel('elements');

   private overlay: Overlay;

   private previousSelectedItemId: IControlNode['id'] | undefined;

   private currentModuleName: string = '';

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
      this.channel.addListener(
         'getSynchronizationsList',
         this.__getSyncList.bind(this)
      );
      this.channel.addListener(
         'getSynchronization',
         this.__getSynchronization.bind(this)
      );
      this.channel.addListener(
         'toggleProfiling',
         this.__toggleProfiling.bind(this)
      );
      this.channel.addListener(
         'getControlChangesOnSynchronization',
         this.__getControlChangesOnSynchronization.bind(this)
      );
      this.channel.addListener(
         'getProfilingStatus',
         this.__getProfilingStatus.bind(this)
      );
      if (window.__WASABY_START_PROFILING) {
         this.__toggleProfiling(!!window.__WASABY_START_PROFILING);
         this.isDevtoolsOpened = true;
      }
   }

   private __onDevtoolsOpened(): void {
      this.isDevtoolsOpened = true;

      this.elements.forEach((node) => {
         const message: IOperationEvent['args'] = [
            OperationType.CREATE,
            node.id,
            node.name,
            this.__getControlType(node)
         ];
         if (node.parentId) {
            message.push(node.parentId);
         }

         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      });

      this.channel.dispatch('longMessage');
   }

   onStartSync(rootId: IControlNode['id']): void {
      this.rootStack.push(rootId);
      this.changedRoots.set(rootId, new Map());
   }

   onStartCommit(node: IControlNode, operation: OperationType): void {
      const currentRootId = this.rootStack[this.rootStack.length - 1];
      const currentRoot = this.changedRoots.get(currentRootId);
      if (!currentRoot) {
         throw new Error('Trying to change nonexistent root');
      }
      this.currentModuleName = node.name;
      currentRoot.set(node.id + currentRootId, {
         node,
         operation,
         selfStartTime: performance.now(),
         selfDuration: NaN
      });
   }

   onEndCommit(node: IControlNode): void {
      const currentRootId = this.rootStack[this.rootStack.length - 1];
      const id = node.id + currentRootId;
      const currentRoot = this.changedRoots.get(currentRootId);
      if (!currentRoot) {
         throw new Error('Trying to change nonexistent root');
      }
      const changedNode = currentRoot.get(id);
      if (!changedNode) {
         throw new Error('Trying to change nonexistent node');
      }

      currentRoot.set(id, {
         ...changedNode,
         node: {
            ...changedNode.node,
            ...node,
            id,
            parentId: changedNode.node.parentId
               ? changedNode.node.parentId + currentRootId
               : undefined
         },
         selfDuration: performance.now() - changedNode.selfStartTime
      });
   }

   onEndSync(rootId: IControlNode['id']): void {
      const changes = this.changedRoots.get(rootId);
      if (!changes) {
         throw new Error('Trying to change nonexistent root');
      }
      changes.forEach(({ operation, node }) => {
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
      });
      if (this.isProfiling) {
         /**
          * To provide the best experience we'd be storing snapshot of the application's state for each synchronization.
          * Unfortunately, this is very expensive and makes exporting to JSON impossible.
          * A lot of things can't be stringified and properly recreated after (DOM-elements, functions, etc.).
          * Also, application's state can contain some confidential information which should never be exported.
          *
          * But in most cases, knowing what's changed is enough to fix the problem.
          * This is a lot cheaper, because we need to store only a couple of string arrays for each changed control.
          */
         const id = guid();
         this.changedNodesBySynchronization.set(id, changes);
         this.channel.dispatch('endSynchronization', id);
      }
      this.changedRoots.delete(rootId);
      this.rootStack.pop();
   }

   getCurrentModuleName(): string {
      return this.currentModuleName;
   }

   private __handleAdd(node: IControlNode): void {
      this.elements.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [
            OperationType.CREATE,
            node.id,
            node.name,
            this.__getControlType(node)
         ];
         if (node.parentId) {
            message.push(node.parentId);
         }
         this.channel.dispatch('operation', message);
      }
   }

   private __getControlType(node: IControlNode): ControlType {
      if (node.instance) {
         return typeof node.options === 'object' && node.options.content
            ? ControlType.HOC
            : ControlType.CONTROL;
      }
      return ControlType.TEMPLATE;
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

      //TODO: удалить после того как ключи будут браться из инферно
      if (node.id.indexOf('popup') !== -1) {
         this.elements.forEach((element, key) => {
            if (element.instance && element.instance._destroyed) {
               this.elements.delete(key);
               this.__removeChildren(key);

               if (this.isDevtoolsOpened) {
                  const message: IOperationEvent['args'] = [
                     OperationType.DELETE,
                     key
                  ];
                  this.channel.dispatch('operation', message);
               }
            }
         });
      }

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

   private __findControlByDomNode(
      element: HTMLElement
   ): IControlNode | undefined {
      let currentElement = element;

      /*
      TODO: сейчас на странице могут быть элементы с одинаковыми ключами, для этого я к ключу каждого элемента добавляю id корня, в котором он находится
      Потом ключи будут браться из инферно и будут уникальными, и все костыли с приклеиванием rootId можно будет убрать
       */
      function getRootId(elem: HTMLElement): string {
         let currentRoot = elem;
         while (currentRoot) {
            if (
               currentRoot.controlNodes &&
               currentRoot.controlNodes[currentRoot.controlNodes.length - 1]
                  .key === '_'
            ) {
               return (
                  '_' +
                  currentRoot.controlNodes[currentRoot.controlNodes.length - 1]
                     .id
               );
            }
            currentRoot = currentRoot.parentElement;
         }
         return '_inst_1';
      }
      const rootId = getRootId(element);

      while (currentElement) {
         if (currentElement.controlNodes) {
            if (
               this.previousSelectedItemId &&
               currentElement.controlNodes.find(
                  (node) => node.key + rootId === this.previousSelectedItemId
               )
            ) {
               return this.elements.get(this.previousSelectedItemId);
            }
            return this.elements.get(
               currentElement.controlNodes[
                  currentElement.controlNodes.length - 1
               ].key + rootId
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

   private __getSyncList(): void {
      this.channel.dispatch(
         'synchronizationsList',
         Array.from(this.changedNodesBySynchronization.entries()).map(
            ([key, value]) => {
               return {
                  id: key,
                  //TODO: на самом деле это неправильная цифра, т.к. сейчас тут теряется вся работа инферно + время между построением компонентов
                  selfDuration: Array.from(value.values()).reduce(
                     (acc, node) => {
                        return acc + node.selfDuration;
                     },
                     0
                  )
               };
            }
         )
      );
   }

   private __getSynchronization(id: string): void {
      const synchronization = this.changedNodesBySynchronization.get(id);
      if (!synchronization) {
         throw new Error('Trying to get nonexistent synchronization');
      }
      this.channel.dispatch('synchronization', {
         changes: Array.from(synchronization.entries()).map(([key, value]) => {
            return {
               id: key,
               selfDuration: value.selfDuration
            };
         }),
         id
      });
   }

   private __getControlChangesOnSynchronization({
      synchronizationId,
      commitId
   }: {
      synchronizationId: string;
      commitId: string;
   }): void {
      const synchronization = this.changedNodesBySynchronization.get(
         synchronizationId
      );
      if (!synchronization) {
         throw new Error('Trying to get nonexistent synchronization');
      }
      const changedNode = synchronization.get(commitId);

      function processChanges(value?: object): string | undefined {
         let result;
         if (value) {
            result = Object.keys(value)
               .map((key) => {
                  return key.replace('attr:', '');
               })
               .join(', ');
         }
         return result;
      }

      if (changedNode) {
         this.channel.dispatch('controlChanges', {
            changedOptions: processChanges(changedNode.node.changedOptions),
            changedAttributes: processChanges(
               changedNode.node.changedAttributes
            ),
            isFirstRender: changedNode.operation === OperationType.CREATE,
            commitId,
            synchronizationId
         });
      } else {
         this.channel.dispatch('controlChanges');
      }
   }

   private __toggleProfiling(state: boolean = !this.isProfiling): void {
      this.isProfiling = state;
      if (state) {
         this.changedNodesBySynchronization.clear();
      }
      this.channel.dispatch('profilingStatus', this.isProfiling);
   }

   private __getProfilingStatus(): void {
      this.channel.dispatch('profilingStatus', this.isProfiling);
   }
}

export default Agent;
