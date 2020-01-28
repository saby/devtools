/**
 * TODO: надо подумать на тему реордера, скорее всего я смогу сам диффить порядок детей старой и новой ноды, даже полный дифф не нужен, достаточно просто узнать одинаковый ли порядок
 * TODO: подумать в сторону редактирования, пока непонятно как его делать. У контрол нод иммутабельные опции
 */
import prepareForSerialization from './prepareForSerialization';
import {
   IBackendControlNode,
   IControlChanges,
   IControlNode,
   ITemplateChanges,
   ITemplateNode,
   IWasabyElement
} from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { DevtoolChannel } from '../_devtool/Channel';
import { guid } from 'Extension/Utils/guid';
import {
   addRef,
   endMark,
   endSyncMark,
   getCondition,
   getContainerForNode,
   getControlType,
   getEvents,
   getObjectDiff,
   getSyncList,
   isControlNode,
   isTemplateNode,
   isVisible,
   startMark,
   startSyncMark
} from './Utils';
import Highlighter from './Highlighter';
import { IBackendProfilingData } from 'Extension/Plugins/Elements/IProfilingData';
import deepClone from './deepClone';
import getNodeId from './getNodeId';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { GlobalMessages } from 'Extension/const';
import { globalChannel } from '../_devtool/globalChannel';

export interface IChangedNode {
   node: IBackendControlNode;
   operation: OperationType;
}

/**
 * Stores information from the framework.
 * This information gets send to the frontend through the channel at the end of every synchronization if devtools were opened at least once during the agent's lifetime.
 * @author Зайцев А.С.
 */
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
      Node,
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
      number,
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
   private rootStack: number[] = [];

   private componentsStack: Array<IBackendControlNode['id']> = [];

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

   private initialIdToDuration: Map<
      IBackendControlNode['id'],
      number
   > = new Map();

   private logger: INamedLogger;

   private vNodeToParentId: WeakMap<
      IControlNode | ITemplateNode,
      IBackendControlNode['id']
   > = new WeakMap();

   /**
    * Mutation observer is used for tracking DOM changes during profiling.
    */
   private mutationObserver: MutationObserver;
   /**
    * This set is used to track DOM changes of controls.
    * If DOM was changed - all controls from the closest control node get added here.
    */
   private dirtyControls: Set<IBackendControlNode['id']> = new Set();
   /**
    * This set is used to speed up the mutation observer callback.
    * If a DOM element gets changed during synchronization it gets added here and will be ignored
    * until the next synchronization.
    */
   private dirtyContainers: Set<Node> = new Set();
   /**
    * This set is used to find controls with received state.
    * If a control has received state from a server and returns Promise from _beforeMount we should show a warning in the profiler.
    */
   private controlsWithReceivedStates: Set<string>;

   constructor(config: { logger: INamedLogger }) {
      globalChannel.addListener(
         GlobalMessages.devtoolsClosed,
         this.__onDevtoolsClosed.bind(this)
      );
      this.logger = config.logger;
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
      this.channel.addListener(
         'setBreakpoint',
         this.__setBreakpoint.bind(this)
      );
      this.mutationObserver = new MutationObserver(
         this.__mutationObserverCallback.bind(this)
      );
      if (window.__WASABY_START_PROFILING) {
         this.__toggleProfiling(window.__WASABY_START_PROFILING);
         this.isDevtoolsOpened = true;
         try {
            this.controlsWithReceivedStates = new Set(
               Object.keys(JSON.parse(window.receivedStates))
            );
         } catch (e) {
            this.logger.error(new Error("Can't read received states"));
         }
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

   /**
    * Adds the rootId to the stack so we can batch operations by synchronization.
    * This hook is called from two places:
    * 1) From Synchronizer.
    * 2) From DOMEnvironment.
    *
    * Synchronizer can call the hook several times in a row if the root contains async controls.
    * DOMEnvironment always calls the hook exactly once.
    *
    * In any case, if the synchronization for the root already started, we should move it to the top of the root stack without losing changes.
    */
   onStartSync(rootId: number): void {
      if (this.changedRoots.has(rootId)) {
         this.rootStack.splice(this.rootStack.indexOf(rootId), 1);
         this.rootStack.push(rootId);
         return;
      }
      this.rootStack.push(rootId);
      this.changedRoots.set(rootId, new Map());
      if (this.isProfiling) {
         this.mutationObserver.observe(document, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
         });
      }
      startSyncMark(rootId);
   }

   onStartCommit(
      operation: OperationType,
      name: string,
      oldNode?: IControlNode | ITemplateNode
   ): void {
      const currentRoot = this.__getCurrentRoot();
      const id = this.__getNodeId(oldNode);

      if (currentRoot.has(id)) {
         const changedNode = currentRoot.get(id) as IChangedNode;
         changedNode.node.selfStartTime = performance.now();
         startMark(name, id, changedNode.operation);
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
            operation
         });
         startMark(name, id, operation);
      }
      this.componentsStack.push(id);
   }

   onEndCommit(
      node: IBackendControlNode,
      data?: ITemplateChanges | IControlChanges
   ): void {
      const currentRoot = this.__getCurrentRoot();
      const changedNode = this.getCurrentNode();

      const commitDuration = performance.now() - changedNode.node.selfStartTime;
      changedNode.node.selfDuration += commitDuration;
      endMark(
         changedNode.node.name,
         changedNode.node.id,
         changedNode.operation
      );

      changedNode.node.parentId = this.__getParentId(node);
      if (changedNode.node.id === changedNode.node.parentId) {
         this.logger.error(new Error("control's id and parentId are the same"));
      }

      const parentId = changedNode.node.parentId;
      if (typeof parentId !== 'undefined' && currentRoot.has(parentId)) {
         const parent = currentRoot.get(parentId);
         if (parent) {
            parent.node.treeDuration += commitDuration;
            if (!this.componentsStack.includes(parentId)) {
               parent.node.selfDuration += commitDuration;
            }
         }
      }

      // TODO: подумать на тему 1 контрол - несколько контейнеров. Актуально для шаблонов с несколькими корнями
      // TODO: подумать про невидимые ноды
      if (
         changedNode.operation === OperationType.CREATE ||
         changedNode.operation === OperationType.UPDATE
      ) {
         if (isTemplateNode(node) && node.children && node.children[0]) {
            node.children[0].ref = addRef(
               changedNode,
               node.ref,
               node.children[0].ref
            );
         }
      }

      if (this.isProfiling) {
         if (
            changedNode.operation === OperationType.CREATE &&
            data.instance &&
            data.instance._$resultBeforeMount
         ) {
            if (
               this.controlsWithReceivedStates &&
               this.controlsWithReceivedStates.has(node.key)
            ) {
               changedNode.node.unusedReceivedState = true;
               this.controlsWithReceivedStates.delete(node.key);
            }
         }
      }

      this.vNodeToId.set(node, changedNode.node.id);
      changedNode.node = {
         ...changedNode.node,
         ...data
      };
      this.componentsStack.pop();
   }

   private getCurrentNode(): IChangedNode {
      const currentRoot = this.__getCurrentRoot();
      if (this.componentsStack.length === 0) {
         throw new Error("There're no nodes in progress");
      }
      const id = this.componentsStack[this.componentsStack.length - 1];
      if (typeof id === 'undefined') {
         throw new Error("There're no nodes in progress");
      }
      const changedNode = currentRoot.get(id);
      if (!changedNode) {
         throw new Error('Trying to change nonexistent node');
      }
      return changedNode;
   }

   saveChildren(
      children: ITemplateNode['children'] | IControlNode['markup']
   ): void {
      if (children) {
         if (isControlNode(children) || isTemplateNode(children)) {
            const id = this.getCurrentNode().node.id;
            if (
               this.vNodeToParentId.has(children) &&
               this.vNodeToParentId.get(children) !== id
            ) {
               this.logger.error(
                  new Error('This child already belongs to a different parent')
               );
            }
            this.vNodeToParentId.set(children, id);
         } else if (Array.isArray(children)) {
            children.forEach((child) => {
               this.saveChildren(child);
            });
         } else if (children.children) {
            this.saveChildren(children.children);
         }
      }
   }

   /**
    * Returns changed node without relying on root stack.
    * When lifecycle hooks get called nodes from different roots get mixed
    * in one synchronization.
    * This will not be fixed in foreseeable future, so we have to search for the node across all roots.
    */
   private findUncommittedNode(
      id: IBackendControlNode['id']
   ): IChangedNode | void {
      for (const root of this.changedRoots.values()) {
         if (root.has(id)) {
            return root.get(id);
         }
      }
   }

   onStartLifecycle(node: IControlNode): void {
      const id = this.__getNodeId(node);
      const changedNode = this.findUncommittedNode(id);

      if (changedNode) {
         changedNode.node.selfStartTime = performance.now();
         startMark(changedNode.node.name, changedNode.node.id);
         this.componentsStack.push(changedNode.node.id);
      } else {
         this.logger.error(new Error("Can't find the node with this id"));
      }
   }

   onEndLifecycle(node: IControlNode): void {
      const id = this.__getNodeId(node);
      const changedNode = this.findUncommittedNode(id);

      if (changedNode) {
         const lifecycleDuration =
            performance.now() - changedNode.node.selfStartTime;
         changedNode.node.selfDuration += lifecycleDuration;
         endMark(changedNode.node.name, changedNode.node.id);

         const parentId = changedNode.node.parentId;
         if (typeof parentId !== 'undefined') {
            const parent = this.findUncommittedNode(parentId);
            if (parent) {
               parent.node.treeDuration += lifecycleDuration;
               parent.node.selfDuration += lifecycleDuration;
            }
         }

         this.componentsStack.pop();
      } else {
         this.logger.error(new Error("Can't find the node with this id"));
      }
   }

   onEndSync(rootId: number): void {
      const changes = this.changedRoots.get(rootId);
      if (!changes) {
         this.logger.error(new Error('Trying to change nonexistent root'));
         return;
      }
      endSyncMark(rootId);
      if (this.isProfiling) {
         /*
         Because observer calls callback asynchronously there is no guarantee that every change was handled.
         We should manually take records from the queue and pass them to the callback.
          */
         this.__mutationObserverCallback(this.mutationObserver.takeRecords());
      }
      changes.forEach(({ operation, node }) => {
         if (node.selfDuration - node.treeDuration < 0) {
            this.logger.error(
               new Error(
                  `Duration shouldn't be negative. Id: ${node.id}, name: ${node.name}.`
               )
            );
         }
         node.selfDuration -= node.treeDuration;
         switch (operation) {
            case OperationType.DELETE:
               this.__handleRemove(node);
               break;
            case OperationType.CREATE:
               this.__handleAdd(node);
               break;
            case OperationType.UPDATE:
               this.__handleUpdate(node);
               break;
         }
         this.__addProfilingData(node, operation);
      });
      const id = guid();
      if (this.isProfiling) {
         this.changedNodesBySynchronization.set(id, changes);
         this.__cleanupMutationObserver();
      }
      if (this.isDevtoolsOpened) {
         window.__WASABY_DEV_HOOK__.pushMessage('endSynchronization', id);
         this.channel.dispatch('longMessage');
      }
      this.changedRoots.delete(rootId);
      this.rootStack.splice(this.rootStack.indexOf(rootId), 1);
   }

   private __handleAdd(node: IBackendControlNode): void {
      node.container = getContainerForNode(node);
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
      // We can either set container on every update or change a lot of code to use getter.
      // Setting container in one place is easier and doesn't impact performance very much.
      node.container = getContainerForNode(node);
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
            result.events = getEvents(this.elements, id);
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
         value = getEvents(this.elements, id);
      } else {
         const element = this.elements.get(id);
         if (element) {
            value = element[currentProperty as keyof IBackendControlNode];
         }
      }
      while (path.length) {
         currentProperty = path.pop();
         value = value[currentProperty];
      }
      return value;
   }

   private __highlightElement(id?: IBackendControlNode['id']): void {
      if (typeof id !== 'undefined') {
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
      let currentElement: Node | null = element;

      while (currentElement) {
         const nodes = this.domToIds.get(currentElement);
         if (nodes) {
            return this.elements.get(nodes[nodes.length - 1]);
         }
         currentElement = currentElement.parentElement;
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

   private __toggleProfiling(state: boolean = !this.isProfiling): void {
      this.isProfiling = state;
      if (state) {
         this.changedNodesBySynchronization.clear();
         this.initialIdToDuration.clear();
         this.elements.forEach(({ id, selfDuration }) => {
            this.initialIdToDuration.set(id, selfDuration);
         });
      }
      this.__cleanupMutationObserver();
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

   /**
    * Disconnects the mutation observer and clears its data.
    * @private
    */
   private __cleanupMutationObserver(): void {
      this.dirtyContainers.clear();
      this.dirtyControls.clear();
      this.mutationObserver.disconnect();
   }

   /**
    * For every DOM change finds the closest control node and marks all controls on it as dirty.
    * If a DOM node gets changed multiple times during one synchronization it is only processed once.
    * @param mutations Array of DOM changes.
    * @private
    */
   private __mutationObserverCallback(mutations: MutationRecord[]): void {
      mutations.forEach(({ target }) => {
         if (this.dirtyContainers.has(target)) {
            return;
         }
         this.dirtyContainers.add(target);
         const ids = this.domToIds.get(target);
         if (ids) {
            ids.forEach((id) => this.dirtyControls.add(id));
         } else {
            let currentElement: Node | null = target;

            while (currentElement) {
               this.dirtyContainers.add(currentElement);
               const nodes = this.domToIds.get(currentElement);
               if (nodes) {
                  nodes.forEach((id) => this.dirtyControls.add(id));
                  break;
               }
               currentElement = currentElement.parentElement;
            }
         }
      });
   }

   private __getNodeId(node?: object): number {
      if (node) {
         if (this.vNodeToId.has(node)) {
            return this.vNodeToId.get(node) as number;
         } else if (this.vNodeToId.has(node.vnode)) {
            return this.vNodeToId.get(node.vnode) as number;
         } else {
            this.logger.error(
               new Error(
                  'startCommit for this node was called several times in a row without calling endCommit.'
               )
            );
            return -1;
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
            }
            break;
         case OperationType.CREATE:
            if (ids) {
               ids.push(id);
            } else if (dom) {
               this.domToIds.set(dom, [id]);
            } else {
               const root = this.__getCurrentRoot();
               const changedNode = root.get(id) as IChangedNode;
               this.logger.error(
                  new Error(
                     `${changedNode.node.name} with id ${changedNode.node.id} was mounted but doesn't have container.`
                  )
               );
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

   private __getParentId(
      node: IControlNode | ITemplateNode
   ): IBackendControlNode['id'] | undefined {
      return (
         this.vNodeToParentId.get(node) || this.vNodeToParentId.get(node.vnode)
      );
   }

   private __addProfilingData(
      node: IBackendControlNode,
      operation: OperationType
   ): void {
      if (this.isProfiling) {
         switch (operation) {
            case OperationType.CREATE:
               node.domChanged = true;
               node.isVisible = isVisible(node.container);
               break;
            case OperationType.UPDATE:
               if (this.dirtyControls.has(node.id)) {
                  node.domChanged = true;
               }
               node.isVisible = isVisible(node.container);
               break;
         }
      }
   }

   /**
    * Performs the cleanup on devtools closure. Stops sending events, disables selection from the page.
    * @private
    */
   private __onDevtoolsClosed(): void {
      this.isDevtoolsOpened = false;
      this.__toggleSelectFromPage(false);
   }

   /**
    * Constructs array of event handlers and saves it on the hook. Each item of the array is a tuple which declaration can be found in IHook.d.ts.
    * Includes event handlers of the control with the passed id and its' ancestors.
    * @param id Id of the first control to which breakpoints will be added.
    * @param eventName Name of the event which will be handled.
    * @private
    */
   private __setBreakpoint({
      id,
      eventName
   }: {
      id: IBackendControlNode['id'];
      eventName: string;
   }): void {
      let node = this.elements.get(id);
      const breakpoints: Window['__WASABY_DEV_HOOK__']['_breakpoints'] = [];
      const processedHandlers: WeakMap<
         Function,
         WeakSet<IControlNode['instance']>
      > = new WeakMap();
      while (node) {
         const currentId = node.id;
         const eventHandlers = getEvents(this.elements, currentId, true)[
            eventName
         ];
         if (eventHandlers) {
            eventHandlers.forEach((handler) => {
               const control = handler.controlNode.control;
               if (node && (!node.instance || control === node.instance)) {
                  const handledControls = processedHandlers.get(
                     handler.function
                  );
                  let needBreakpoint = false;

                  if (handledControls) {
                     if (!handledControls.has(control)) {
                        handledControls.add(control);
                        needBreakpoint = true;
                     }
                  } else {
                     processedHandlers.set(
                        handler.function,
                        new WeakSet([control])
                     );
                     needBreakpoint = true;
                  }

                  if (needBreakpoint) {
                     const controlId = this.__getNodeId(handler.controlNode);
                     breakpoints.push([
                        handler.function,
                        getCondition(eventName, controlId),
                        controlId,
                        id
                     ]);
                  }
               }
            });
         }

         if (typeof node.parentId !== 'undefined') {
            node = this.elements.get(node.parentId);
         } else {
            break;
         }
      }
      window.__WASABY_DEV_HOOK__._breakpoints = breakpoints;
   }
}

export default Agent;
