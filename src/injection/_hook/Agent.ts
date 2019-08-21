import prepareForSerialization from './prepareForSerialization';
import {
   IBackendControlNode,
   IWasabyElement
} from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { DevtoolChannel } from '../_devtool/Channel';
import { guid } from 'Extension/Utils/guid';
import {
   endMark,
   endSyncMark,
   getControlType,
   getSyncList,
   startMark,
   startSyncMark,
   updateParentDuration
} from './Utils';
import Highlighter from './Highlighter';
import { IWasabyDevHook } from './IHook';
import { IBackendProfilingData } from 'Extension/Plugins/Elements/IProfilingData';
import isDeepEqual from './isDeepEqual';
import deepClone from './deepClone';
import getNodeId from './getNodeId';

export interface IChangedNode {
   node: IBackendControlNode;
   operation: OperationType;
   inProgress: boolean;
}

// TODO: утащить в нормальное место
declare global {
   // tslint:disable-next-line: interface-name
   interface Window {
      __WASABY_DEV_HOOK__: IWasabyDevHook;
      __WASABY_START_PROFILING?: boolean;
      $wasaby?: IBackendControlNode;
      $tmp?: unknown;
      wasabyDevtoolsOptions?: {
         useUserTimingAPI?: boolean;
      };
   }
}

function getObjectDiff(obj1?: object, obj2?: object): object | undefined {
   if (!obj1) {
      return obj2 ? obj2 : undefined;
   }
   if (!obj2) {
      return obj1 ? obj1 : undefined;
   }
   const diff = Object.keys(obj1).reduce((result, key) => {
      if (!obj2.hasOwnProperty(key)) {
         result.push(key);
      } else if (!isDeepEqual(obj1[key], obj2[key])) {
         return result;
      } else {
         const resultKeyIndex = result.indexOf(key);
         result.splice(resultKeyIndex, 1);
      }
      return result;
   }, Object.keys(obj2));
   if (diff.length === 0) {
      return;
   } else {
      const resultDiff = {};
      diff.forEach((key) => {
         resultDiff[key] = obj2[key];
      });
      return resultDiff;
   }
}

class Agent {
   /**
    * This map is needed because framework can't generate unique keys, so we use virtual nodes instead of keys.
    * But because we can't use virtual nodes on the devtools side, we have to map every node to a number.
    */
   private vNodeToId: WeakMap<
      object,
      IBackendControlNode['id']
   > = new WeakMap();
   /**
    * This map is just used to speed up search for virtual node by dom node.
    */
   private domToIds: WeakMap<
      Element,
      Array<IBackendControlNode['id']>
   > = new WeakMap();
   /**
    * This map is the source of truth for devtools.
    * This map updates after every synchronization and makes following assumptions:
    * 1) All elements have a unique key.
    * 2) A parent node gets inserted earlier than it's children. They don't have to be close to each other.
    * 3) Order of insertion is the order of children in element's tree (this is bad, but we don't have a way to
    * get the position of a child).
    */
   private elements: Map<
      IBackendControlNode['id'],
      IBackendControlNode
   > = new Map();
   /**
    * This map is used to batch updates by root during synchronization.
    */
   private changedRoots: Map<
      string,
      Map<IBackendControlNode['id'], IChangedNode>
   > = new Map();
   /**
    * This map is used to store changes during profiling.
    *
    * To provide the best experience we'd be storing snapshot of the application's state for each synchronization.
    * Unfortunately, this is very expensive and makes exporting to JSON impossible.
    * A lot of things can't be stringified and properly recreated after (DOM-elements, functions, etc.).
    * Also, application's state may contain some confidential information which should never be exported.
    *
    * But in most cases, knowing what's changed is enough to fix the problem.
    * This is a lot cheaper, because we need to store only a couple of string arrays for each changed control.
    */
   private changedNodesBySynchronization: Map<
      string,
      Map<IBackendControlNode['id'], IChangedNode>
   > = new Map();
   /**
    * This is used to track which root gets synchronized, so we can batch updates by root.
    */
   private rootStack: string[] = [];

   private isDevtoolsOpened: boolean = false;

   private isProfiling: boolean = false;

   private channel: DevtoolChannel = new DevtoolChannel('elements');

   private highlighter: Highlighter = new Highlighter({
      onSelect: this.__selectByDomNode.bind(this)
   });
   /**
    * This is the id of the node closest to the element selected in the Elements tab of native devtools.
    */
   private idClosestToPreviousSelectedElement?: IBackendControlNode['id'];

   private selectedNodePreviousState?: object;

   private currentModuleName: string = '';

   private initialIdToDuration: Map<
      IBackendControlNode['id'],
      number
   > = new Map();

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
         'toggleProfiling',
         this.__toggleProfiling.bind(this)
      );
      this.channel.addListener(
         'getProfilingData',
         this.__getProfilingData.bind(this)
      );
      this.channel.addListener(
         'getProfilingStatus',
         this.__getProfilingStatus.bind(this)
      );
      if (window.__WASABY_START_PROFILING) {
         this.__toggleProfiling(window.__WASABY_START_PROFILING);
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
            getControlType(node)
         ];
         if (typeof node.parentId !== 'undefined') {
            message.push(node.parentId);
         }

         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      });
      window.__WASABY_DEV_HOOK__.pushMessage('endOfTree');

      this.channel.dispatch('longMessage');
   }

   onStartSync(rootId: string): void {
      this.rootStack.push(rootId);
      this.changedRoots.set(rootId, new Map());
      startSyncMark(rootId);
   }

   onStartCommit(
      operation: OperationType,
      name: string,
      oldNode?: object
   ): number {
      const currentRoot = this.__getCurrentRoot();
      const id = this.__getNodeId(oldNode);

      // TODO: если нода уже есть, то это асинхронное построение, можно это отдельной операцией показывать
      startMark(name, id, operation);
      // TODO: спилить currentModuleName
      this.currentModuleName = name;

      if (currentRoot.has(id)) {
         const changedNode = currentRoot.get(id) as IChangedNode;
         changedNode.node.selfStartTime = performance.now();
         changedNode.operation = operation;
         changedNode.inProgress = true;
      } else {
         currentRoot.set(id, {
            /**
             * TODO: придумать как тут не игнорить ts
             */
            node: {
               id,
               name,
               selfStartTime: performance.now(),
               selfDuration: 0,
               treeDuration: 0
            },
            inProgress: true,
            operation
         });
      }
      return id;
   }

   onEndCommit(
      id: IBackendControlNode['id'],
      node: IBackendControlNode,
      parentId?: IBackendControlNode['parentId']
   ): void {
      const currentRoot = this.__getCurrentRoot();
      const changedNode = currentRoot.get(id);
      if (!changedNode) {
         throw new Error('Trying to change nonexistent node');
      }
      endMark(changedNode.node.name, id, changedNode.operation);
      changedNode.inProgress = false;
      const commitDuration = performance.now() - changedNode.node.selfStartTime;
      changedNode.node.selfDuration += commitDuration;
      updateParentDuration(currentRoot, commitDuration, parentId);
      this.vNodeToId.set(node, id);
   }

   onStartLifecycle(id: IBackendControlNode['id']): void {
      const currentRoot = this.__getCurrentRoot();
      const changedNode = currentRoot.get(id);
      if (!changedNode) {
         throw new Error('Trying to change nonexistent node');
      }
      startMark(changedNode.node.name, id);
      changedNode.node.selfStartTime = performance.now();
      changedNode.inProgress = true;
   }

   onEndLifecycle(currentNode: object, data: IBackendControlNode): void {
      const currentRoot = this.__getCurrentRoot();
      const id = data.id;
      const changedNode = currentRoot.get(id);
      if (!changedNode) {
         throw new Error('Trying to change nonexistent node');
      }
      endMark(data.name, data.id);
      changedNode.inProgress = false;
      this.vNodeToId.set(currentNode, id);

      const lifecycleDuration =
         performance.now() - changedNode.node.selfStartTime;
      const selfDuration = changedNode.node.selfDuration + lifecycleDuration;
      const treeDuration = changedNode.node.treeDuration;

      changedNode.node = data;
      changedNode.node.selfDuration = selfDuration;
      changedNode.node.treeDuration = treeDuration;

      updateParentDuration(currentRoot, lifecycleDuration, data.parentId);
   }

   onEndSync(rootId: string): void {
      const changes = this.changedRoots.get(rootId);
      if (!changes) {
         throw new Error('Trying to change nonexistent root');
      }
      endSyncMark(rootId);
      changes.forEach(({ operation, node }) => {
         if (node.selfDuration - node.treeDuration < 0) {
            throw new Error(`Duration shouldn't be negative. Id: ${node.id}, name: ${node.name}.`);
         }
         node.selfDuration -= node.treeDuration;
         switch (operation) {
            case OperationType.DELETE:
               this.__handleRemove(node as IBackendControlNode);
               break;
            case OperationType.CREATE:
               this.__handleAdd(node as IBackendControlNode);
               break;
            case OperationType.REORDER:
               break;
            case OperationType.UPDATE:
               this.__handleUpdate(node as IBackendControlNode);
               break;
         }
      });
      /**
       * TODO: в слое совместимости иногда попапы закрываются в обход синхронизатора,
       * чистим их при ближайшей синхронизации
       */
      this.elements.forEach((element) => {
         if (element.instance && element.instance._destroyed) {
            this.__handleRemove(element);
         }
      });
      const id = guid();
      if (this.isProfiling) {
         this.changedNodesBySynchronization.set(id, changes);
      }
      if (this.isDevtoolsOpened) {
         window.__WASABY_DEV_HOOK__.pushMessage('endSynchronization', id);
         this.channel.dispatch('longMessage');
      }
      this.changedRoots.delete(rootId);
      this.rootStack.pop();
   }

   getCurrentModuleName(): string {
      return this.currentModuleName;
   }

   private __handleAdd(node: IBackendControlNode): void {
      this.__updateDomToIds(OperationType.CREATE, node.container, node.id);
      this.elements.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [
            OperationType.CREATE,
            node.id,
            node.name,
            getControlType(node)
         ];
         if (typeof node.parentId !== 'undefined') {
            message.push(node.parentId);
         }
         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      }
   }

   private __handleUpdate(node: IBackendControlNode): void {
      if (!this.elements.has(node.id)) {
         this.__handleAdd(node);
         return;
      }
      this.elements.set(node.id, node);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [
            OperationType.UPDATE,
            node.id
         ];
         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      }
   }

   private __handleRemove(node: IBackendControlNode): void {
      this.__removeChildren(node.id);
      this.__removeNode(node);
   }

   private __removeChildren(id: IBackendControlNode['id']): void {
      const parents: Set<IBackendControlNode['parentId']> = new Set();
      this.elements.forEach((element, key) => {
         if (element.parentId === id || parents.has(element.parentId)) {
            parents.add(key);
            this.__removeNode(element);
         }
      });
   }

   private __removeNode({ id, container }: IBackendControlNode): void {
      this.__updateDomToIds(OperationType.DELETE, container, id);
      this.elements.delete(id);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [OperationType.DELETE, id];
         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      }
   }

   private __inspectElement({
      id,
      expandedTabs,
      newTab,
      reset
   }: {
      id: IBackendControlNode['id'];
      expandedTabs: Array<'attributes' | 'state' | 'options'>;
      newTab?: 'attributes' | 'state' | 'options';
      reset: boolean;
   }): void {
      const node = this.elements.get(id);
      if (node) {
         /**
          * TODO: пока считаем, что события не меняются никогда
          * TODO: посылать только содержимое раскрытых вкладок, всё остальное заменить на заглушки
          */
         const result: Partial<IBackendControlNode> & {
            isControl?: boolean;
            events?: Record<
               string,
               Array<{ function: Function; arguments: unknown[] }>
            >;
            changedState?: object;
         } = {
            id
         };
         if (reset) {
            result.attributes = node.attributes;
            result.state = node.state;
            result.options = node.options;
            result.events = this.__getEvents(id);
            result.isControl = !!node.instance;
            this.selectedNodePreviousState = result.isControl
               ? deepClone(node.state)
               : undefined;
            window.__WASABY_DEV_HOOK__.pushMessage('inspectedElement', {
               type: 'full',
               node: prepareForSerialization(result)
            });
            this.channel.dispatch('longMessage');
         } else {
            let hasChanges = false;
            expandedTabs.forEach((tabName) => {
               if (newTab === tabName) {
                  hasChanges = true;
                  result[tabName] = node[tabName];
                  if (tabName === 'state') {
                     this.selectedNodePreviousState = deepClone(node.state);
                  }
                  return;
               }
               switch (tabName) {
                  case 'attributes':
                     if (node.changedAttributes) {
                        hasChanges = true;
                        result.changedAttributes = node.changedAttributes;
                        node.changedAttributes = undefined;
                     }
                     break;
                  case 'state':
                     const changedState = getObjectDiff(
                        this.selectedNodePreviousState,
                        node.state
                     );
                     if (changedState) {
                        hasChanges = true;
                        result.changedState = changedState;
                        this.selectedNodePreviousState = deepClone(node.state);
                     }
                     break;
                  case 'options':
                     if (node.changedOptions) {
                        hasChanges = true;
                        result.changedOptions = node.changedOptions;
                        node.changedOptions = undefined;
                     }
                     break;
               }
            });
            if (hasChanges) {
               window.__WASABY_DEV_HOOK__.pushMessage('inspectedElement', {
                  type: 'partial',
                  node: prepareForSerialization(result)
               });
               this.channel.dispatch('longMessage');
            }
         }

         window.$wasaby = { ...node };
      }
   }

   private __viewTemplate(id: IBackendControlNode['id']): void {
      const node = this.elements.get(id);
      if (node) {
         window.__WASABY_DEV_HOOK__.__template = node.template;
      }
   }

   private __viewConstructor(id: IBackendControlNode['id']): void {
      const node = this.elements.get(id);
      if (node && node.instance) {
         window.__WASABY_DEV_HOOK__.__constructor = node.instance.constructor;
      }
   }

   private __viewContainer(id: IBackendControlNode['id']): void {
      const node = this.elements.get(id);
      if (node) {
         window.__WASABY_DEV_HOOK__.__container = node.container;
      }
   }

   private __viewFunctionSource({
      id,
      path
   }: {
      id: IBackendControlNode['id'];
      path: Array<string | number>;
   }): void {
      window.__WASABY_DEV_HOOK__.__function = this.__getValueByPath(
         id,
         path
      ) as Function;
   }

   private __storeAsGlobal({
      id,
      path
   }: {
      id: IBackendControlNode['id'];
      path: Array<string | number>;
   }): void {
      window.$tmp = this.__getValueByPath(id, path);
      // tslint:disable-next-line: no-console
      console.log('$tmp = ', window.$tmp);
   }

   private __getValueByPath(
      id: IBackendControlNode['id'],
      path: Array<string | number>
   ): unknown {
      let currentProperty = path.pop();
      let value;
      if (currentProperty === 'events') {
         value = this.__getEvents(id);
      } else {
         const element = this.elements.get(id);
         if (element) {
            value = element[currentProperty as keyof IBackendControlNode];
         }
      }
      while (path.length) {
         currentProperty = path.pop();
         // tslint:disable-next-line: ban-ts-ignore
         // @ts-ignore
         value = value[currentProperty];
      }
      return value;
   }

   private __highlightElement(id?: IBackendControlNode['id']): void {
      if (id) {
         const node = this.elements.get(id);
         if (node && node.container) {
            this.highlighter.highlightElement(node.container, node.name);
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

   private __selectByDomNode(elem: IWasabyElement): void {
      const control = this.__findControlByDomNode(elem);
      if (control) {
         this.channel.dispatch('setSelectedItem', control.id);
      } else {
         this.channel.dispatch('stopSelectFromPage');
      }
   }

   private __findControlByDomNode(
      element: Element
   ): IBackendControlNode | undefined {
      let currentElement = element;

      while (currentElement) {
         const nodes = this.domToIds.get(currentElement);
         if (nodes) {
            return this.elements.get(nodes[nodes.length - 1]);
         }
         currentElement = currentElement.parentElement as Element;
      }
      return;
   }

   private __getSelectedItem(): void {
      const node =
         this.__findControlByDomNode(window.__WASABY_DEV_HOOK__.$0) ||
         this.elements.values().next().value;
      if (node && this.idClosestToPreviousSelectedElement !== node.id) {
         this.channel.dispatch('setSelectedItem', node.id);
         this.idClosestToPreviousSelectedElement = node.id;
      }
   }

   private __getEvents(
      id: IBackendControlNode['id']
   ): Record<string, Array<{ function: Function; arguments: unknown[] }>> {
      const EVENT_NAME_OFFSET = 3;
      const node = this.elements.get(id);
      const events: Record<
         string,
         Array<{ function: Function; arguments: unknown[] }>
      > = {};
      if (node && node.container.eventProperties) {
         const eventProperties = node.container.eventProperties;
         Object.keys(eventProperties).forEach((key) => {
            events[key.slice(EVENT_NAME_OFFSET)] = eventProperties[key].map(
               (handler) => {
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
               }
            );
         });
      }
      return events;
   }

   private __toggleProfiling(state: boolean = !this.isProfiling): void {
      this.isProfiling = state;
      if (state) {
         this.changedNodesBySynchronization.clear();
         this.initialIdToDuration.clear();
         this.elements.forEach(({ id, selfDuration }) => {
            this.initialIdToDuration.set(id, selfDuration);
         });
      }
      this.channel.dispatch('profilingStatus', this.isProfiling);
   }

   private __getProfilingStatus(): void {
      this.channel.dispatch('profilingStatus', this.isProfiling);
   }

   private __getProfilingData(): void {
      const profilingData: IBackendProfilingData = {
         initialIdToDuration: Array.from(this.initialIdToDuration.entries()),
         syncList: getSyncList(this.changedNodesBySynchronization)
      };
      this.initialIdToDuration.clear();
      this.changedNodesBySynchronization.clear();
      this.channel.dispatch('profilingData', profilingData);
   }

   private __getNodeId(node?: object): number {
      if (node) {
         if (this.vNodeToId.has(node)) {
            return this.vNodeToId.get(node) as number;
         } else {
            throw new Error(
               'startCommit for this node was called several times in a row without calling endCommit.'
            );
         }
      }
      return getNodeId();
   }

   private __updateDomToIds(
      operation: OperationType,
      dom: Element,
      id: IBackendControlNode['id']
   ): void {
      const ids = this.domToIds.get(dom);
      switch (operation) {
         case OperationType.DELETE:
            if (ids) {
               if (ids.length === 1) {
                  this.domToIds.delete(dom);
               } else {
                  const index = ids.indexOf(id);
                  ids.splice(index, 1);
               }
            } else {
               throw new Error('Trying to delete nonexistent node');
            }
            break;
         case OperationType.CREATE:
            if (ids) {
               ids.push(id);
            } else {
               this.domToIds.set(dom, [id]);
            }
            break;
      }
   }

   private __getCurrentRoot(): Map<IBackendControlNode['id'], IChangedNode> {
      const currentRootId = this.rootStack[this.rootStack.length - 1];
      const currentRoot = this.changedRoots.get(currentRootId);
      if (!currentRoot) {
         throw new Error('Trying to change nonexistent root');
      }
      return currentRoot;
   }
}

export default Agent;
