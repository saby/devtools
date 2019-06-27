import prepareForSerialization from './prepareForSerialization';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { DevtoolChannel } from '../_devtool/Channel';
import { guid } from 'Extension/Utils/guid';
import { endMark, startMark, updateSelfDurations } from './Utils';
import Highlighter from './Highlighter';

export interface IChangedNode {
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

   private unfinishedNodes: Set<IChangedNode> = new Set();

   private isDevtoolsOpened: boolean = false;

   private isProfiling: boolean = false;

   private channel: DevtoolChannel = new DevtoolChannel('elements');

   private highlighter: Highlighter = new Highlighter({
      onSelect: this.__selectByDomNode.bind(this)
   });

   private previousSelectedItemId: IControlNode['id'] | undefined;

   private currentModuleName: string = '';

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
      this.channel.addListener(
         'toggleSelectFromPage',
         this.__toggleSelectFromPage.bind(this)
      );
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

      startMark(node.name, operation);

      this.currentModuleName = node.name;
      const id = node.id + currentRootId;

      currentRoot.set(id, {
         node,
         operation,
         selfStartTime: performance.now(),
         selfDuration: 0
      });
      this.unfinishedNodes.add(currentRoot.get(id) as IChangedNode);
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

      /**
       * Sometimes, commit finishes only after children of the node were committed.
       * In order to get correct duration, we have to subtract children durations.
       *
       * So, we're doing this:
       * 1) When commit starts, we initialize duration with 0 and add node to a set of unfinished nodes.
       * 2) When commit ends, we calculate selfDuration of a node.
       * 3) Then, we subtract duration of the current node from every unfinished node.
       *
       * This way, some nodes are going to have negative duration at the end of their commit.
       * This is a sum of durations of their children.
       *
       * So, the formula to calculate selfDuration is:
       */
      const selfDuration =
         changedNode.selfDuration +
         performance.now() -
         changedNode.selfStartTime;

      endMark(changedNode.node.name, changedNode.operation);

      this.unfinishedNodes.delete(changedNode);
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
         selfDuration
      });

      if (this.isProfiling) {
         updateSelfDurations(this.unfinishedNodes, selfDuration);
      }
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
      const id = guid();
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
         this.changedNodesBySynchronization.set(id, changes);
      }
      this.channel.dispatch('endSynchronization', id);
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

      // TODO: удалить после того как ключи будут браться из инферно
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
      if (id) {
         const node = this.elements.get(id);
         if (node && node.instance && node.instance._container) {
            this.highlighter.highlightElement(node.instance._container, node.name);
            return;
         }
      }
      this.highlighter.highlightElement();
   }

   private __toggleSelectFromPage(state: boolean): void {
      if (state) {
         this.highlighter.startSelectingFromPage();
      } else {
         this.highlighter.stopSelectingFromPage();
      }
   }

   private __selectByDomNode(elem: Element): void {
      const control = this.__findControlByDomNode(elem);
      if (control) {
         this.channel.dispatch('setSelectedItem', control.id);
      } else {
         this.channel.dispatch('stopSelectFromPage');
      }
   }

   private __findControlByDomNode(
      element: Element
   ): IControlNode | undefined {
      let currentElement = element;

      /*
      TODO: сейчас на странице могут быть элементы с одинаковыми ключами, для этого я к ключу каждого элемента добавляю id корня, в котором он находится
      Потом ключи будут браться из инферно и будут уникальными, и все костыли с приклеиванием rootId можно будет убрать
       */
      function getRootId(elem: Element): string {
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
                  // TODO: на самом деле это неправильная цифра, т.к. сейчас тут теряется вся работа инферно + время между построением компонентов
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
