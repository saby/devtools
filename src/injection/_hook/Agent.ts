/**
 * TODO: надо подумать на тему реордера, скорее всего я смогу сам диффить порядок детей старой и новой ноды, даже полный дифф не нужен, достаточно просто узнать одинаковый ли порядок
 * TODO: подумать в сторону редактирования, пока непонятно как его делать. У контрол нод иммутабельные опции
 */
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
   findControlByDomNode,
   getCondition,
   getControlType,
   getEvents,
   getObjectDiff,
   isControlNode,
   isTemplateNode,
   isVisible
} from './Utils';
import { getRef, updateContainer } from './_utils/ContainerHandling';
import Highlighter from './Highlighter';
import { IBackendProfilingData } from 'Extension/Plugins/Elements/IProfilingData';
import deepClone from './deepClone';
import getNodeId from './getNodeId';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { GlobalMessages } from 'Extension/const';
import { getGlobalChannel } from '../_devtool/globalChannel';
import { getSyncList } from './_utils/Profiling';
import {
   endMark,
   endSyncMark,
   startMark,
   startSyncMark
} from './_utils/UserTimingAPI';
import { dehydrateHelper } from './dehydrate';
import { getValueByPath } from 'Extension/Utils/getValueByPath';
import { IInspectedElement, InspectedPathsMap } from 'Types/ElementInspection';
import ErrorWrapper from './_utils/ErrorWrapper';

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
   private domToIds: WeakMap<Node, IBackendControlNode['id'][]> = new WeakMap();
   /**
    * This map stores container for each node.
    */
   private idToContainers: Map<
      IBackendControlNode['id'],
      IWasabyElement[]
   > = new Map();

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

   private componentsStack: IBackendControlNode['id'][] = [];

   private isDevtoolsOpened: boolean = false;

   private hasFullTree: boolean = false;

   private isProfiling: boolean = false;

   private channel: DevtoolChannel = new DevtoolChannel('elements');

   private highlighter: Highlighter = new Highlighter({
      onSelect: this.selectByDomNode.bind(this)
   });
   /**
    * This is the id of the node closest to the element selected in the Elements tab of native devtools.
    */
   private idClosestToPreviousSelectedElement?: IBackendControlNode['id'];

   /**
    * Id of the element currently inspected by the frontend.
    * Used to determine whether we should send changes only or the full data.
    */
   private currentInspectedElementId?: IBackendControlNode['id'];

   /**
    * Paths currently opened on the frontend. Used to prevent dehydration of opened paths.
    */
   private currentInspectedPaths: InspectedPathsMap = new Map();

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
    * This map is mostly used to determine relationships between uncommitted nodes.
    */
   private idToParentId: Map<
      IBackendControlNode['id'],
      IBackendControlNode['id']
   > = new Map();

   /**
    * The next three fields are used to find the dead nodes. It works like this:
    * every time a control updates we save its children into idToChildrenVNodes.
    * Then at the end of synchronization we diff the children and put the deleted ones into deletedChildrenIds.
    * New children are put into idToChildrenIds, which is also used to speed up deletion.
    * Then at the end of every synchronization we traverse deletedChildrenIds and delete the nodes.
    *
    * The reason we're doing this at all is that we don't actually get a message about the deletion for some nodes.
    * For example:
    * Control
    *    Template
    *    Template
    *    Template
    *
    * If templates inside the control gets replaced by something else we wouldn't get a message.
    * It is even worse when these templates have templates inside of them, we wouldn't get messages for them either.
    */
   private idToChildrenVNodes: Map<
      IBackendControlNode['id'],
      Set<IControlNode | ITemplateNode>
   > = new Map();

   private idToChildrenIds: Map<
      IBackendControlNode['id'],
      Set<IBackendControlNode['id']>
   > = new Map();

   private deletedChildrenIds: Set<IBackendControlNode['id']> = new Set();

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
   private controlsWithReceivedStates: Set<string> = new Set();
   /**
    * This map is used to map instance of control to the id of its controlNode.
    * For example, it is used to calculate id of the logicParent.
    */
   private instanceToId: WeakMap<
      IControlNode['control'],
      IBackendControlNode['id']
   > = new WeakMap();

   private errorWrapper: ErrorWrapper;

   constructor(config: { logger: INamedLogger }) {
      this.logger = config.logger;
      this.errorWrapper = new ErrorWrapper(this.logger);
      this.wrapPublicMethods();
      getGlobalChannel().addListener(
         GlobalMessages.devtoolsClosed,
         this.onDevtoolsClosed.bind(this)
      );
      this.channel.addListener(
         'devtoolsInitialized',
         this.onDevtoolsOpened.bind(this)
      );
      this.channel.addListener(
         'inspectElement',
         this.inspectElement.bind(this)
      );
      this.channel.addListener('viewTemplate', this.viewTemplate.bind(this));
      this.channel.addListener(
         'viewConstructor',
         this.viewConstructor.bind(this)
      );
      this.channel.addListener('viewContainer', this.viewContainer.bind(this));
      this.channel.addListener('storeAsGlobal', this.storeAsGlobal.bind(this));
      this.channel.addListener(
         'getSelectedItem',
         this.getSelectedItem.bind(this)
      );
      this.channel.addListener(
         'viewFunctionSource',
         this.viewFunctionSource.bind(this)
      );
      this.channel.addListener(
         'highlightElement',
         this.highlightElement.bind(this)
      );
      this.channel.addListener(
         'toggleSelectFromPage',
         this.toggleSelectFromPage.bind(this)
      );
      this.channel.addListener(
         'toggleProfiling',
         this.toggleProfiling.bind(this)
      );
      this.channel.addListener(
         'getProfilingData',
         this.getProfilingData.bind(this)
      );
      this.channel.addListener(
         'getProfilingStatus',
         this.getProfilingStatus.bind(this)
      );
      this.channel.addListener('setBreakpoint', this.setBreakpoint.bind(this));
      this.mutationObserver = new MutationObserver(
         this.mutationObserverCallback.bind(this)
      );
      if (window.__WASABY_START_PROFILING) {
         this.toggleProfiling(window.__WASABY_START_PROFILING);
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

   private wrapPublicMethods(): void {
      this.onStartCommit = this.errorWrapper.wrapFunction(this.onStartCommit);
      this.onEndCommit = this.errorWrapper.wrapFunction(this.onEndCommit);
      this.saveChildren = this.errorWrapper.wrapFunction(this.saveChildren);
      this.onStartLifecycle = this.errorWrapper.wrapFunction(
         this.onStartLifecycle
      );
      this.onEndLifecycle = this.errorWrapper.wrapFunction(this.onEndLifecycle);
      this.onStartSync = this.errorWrapper.wrapFunction(this.onStartSync);
      this.onEndSync = this.errorWrapper.wrapFunction(this.onEndSync);
   }

   private onDevtoolsOpened(): void {
      if (this.hasFullTree) {
         return;
      }

      this.isDevtoolsOpened = true;
      this.hasFullTree = true;

      this.elements.forEach((node) => {
         this.constructCreateMessage(node);
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
      const currentRoot = this.getCurrentRoot();
      const id = this.getNodeId(oldNode);

      if (currentRoot.has(id)) {
         const changedNode = currentRoot.get(id) as IChangedNode;
         changedNode.node.selfStartTime = performance.now();
         startMark(name, id, changedNode.operation);
      } else {
         const idToContainers = this.idToContainers;
         currentRoot.set(id, {
            node: {
               id,
               name,
               selfStartTime: performance.now(),
               selfDuration: 0,
               treeDuration: 0,
               lifecycleDuration: 0,
               get containers(): IWasabyElement[] | undefined {
                  return idToContainers.get(id);
               }
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
      const currentRoot = this.getCurrentRoot();
      const changedNode = this.getCurrentNode();
      const id = changedNode.node.id;

      const commitDuration = performance.now() - changedNode.node.selfStartTime;
      changedNode.node.selfDuration += commitDuration;
      endMark(changedNode.node.name, id, changedNode.operation);

      changedNode.node.parentId = this.getParentId(node);
      changedNode.node.logicParentId = this.getLogicParentId(data);

      const parentId = changedNode.node.parentId;
      if (typeof parentId !== 'undefined') {
         this.idToParentId.set(id, parentId);

         const parent = currentRoot.get(parentId);
         if (parent) {
            parent.node.treeDuration += commitDuration;
            if (!this.componentsStack.includes(parentId)) {
               parent.node.selfDuration += commitDuration;
            }
         }
      }

      if (
         changedNode.operation === OperationType.CREATE ||
         changedNode.operation === OperationType.UPDATE
      ) {
         if (node.element) {
            // This is a control which was already mounted. We can just use the existing container.
            const oldContainers = this.idToContainers.get(id);
            updateContainer(
               this.idToContainers,
               this.idToParentId,
               this.domToIds,
               id,
               node.element,
               // Controls can't have multiple containers at the moment, so we just take the first one
               oldContainers ? oldContainers[0] : undefined
            );
         } else if (node.markup) {
            // This is a control that was not mounted, so we're proxying it's element property to catch its container.
            const updateIdToContainer = (
               newContainer: IWasabyElement | null,
               oldContainer: IWasabyElement | null
            ) => {
               updateContainer(
                  this.idToContainers,
                  this.idToParentId,
                  this.domToIds,
                  id,
                  newContainer,
                  oldContainer
               );
            };
            let container: IWasabyElement | null;
            Object.defineProperty(node, 'element', {
               set(newContainer: IWasabyElement): void {
                  if (container === newContainer) {
                     return;
                  }
                  updateIdToContainer(newContainer, container);
                  container = newContainer;
               },
               get(): IWasabyElement | null {
                  return container;
               },
               configurable: true,
               enumerable: true
            });
         } else if (isTemplateNode(node)) {
            if (node.children && node.children.length) {
               // We only care about dom nodes inside template nodes. We'll catch it's element and propagate it.
               node.children.forEach((child) => {
                  if (!isControlNode(child) && !isTemplateNode(child)) {
                     child.ref = getRef(
                        this.idToContainers,
                        this.idToParentId,
                        this.domToIds,
                        changedNode.node.id,
                        child.ref
                     );
                  }
               });
            }
         }
      }

      if (this.isProfiling) {
         if (
            changedNode.operation === OperationType.CREATE &&
            data.instance &&
            data.instance._$resultBeforeMount
         ) {
            changedNode.node.asyncControl = true;
            if (this.controlsWithReceivedStates.has(node.key)) {
               changedNode.node.unusedReceivedState = true;
               this.controlsWithReceivedStates.delete(node.key);
            }
         }
      }

      this.vNodeToId.set(node, id);
      if (
         changedNode.operation === OperationType.CREATE &&
         data &&
         data.instance
      ) {
         this.instanceToId.set(data.instance, id);
      }
      Object.assign(changedNode.node, data);
      this.componentsStack.pop();
   }

   private getCurrentNode(): IChangedNode {
      if (this.componentsStack.length === 0) {
         throw new Error(
            "Trying to commit a node, but there's no uncommitted nodes."
         );
      }
      const currentRoot = this.getCurrentRoot();
      const id = this.componentsStack[this.componentsStack.length - 1];
      const changedNode = currentRoot.get(id);
      if (!changedNode) {
         throw new Error(
            `Trying to commit a node with the id: ${id}, but the node with this id doesn't exist in the current root.`
         );
      }
      return changedNode;
   }

   saveChildren(
      children?: ITemplateNode['children'] | IControlNode['markup']
   ): void {
      if (!children) {
         return;
      }
      const parentId = this.getCurrentNode().node.id;
      const controlsAndTemplates: Set<ITemplateNode | IControlNode> = new Set();
      this.getControlsAndTemplates(controlsAndTemplates, children);

      controlsAndTemplates.forEach((child) => {
         this.vNodeToParentId.set(child, parentId);
      });

      this.idToChildrenVNodes.set(parentId, controlsAndTemplates);
   }

   getControlsAndTemplates(
      controlsAndTemplates: Set<ITemplateNode | IControlNode>,
      children?: ITemplateNode['children'] | IControlNode['markup']
   ): void {
      if (children) {
         if (isControlNode(children) || isTemplateNode(children)) {
            controlsAndTemplates.add(children);
         } else if (Array.isArray(children)) {
            children.forEach((child) => {
               this.getControlsAndTemplates(controlsAndTemplates, child);
            });
         } else if (children.children) {
            this.getControlsAndTemplates(
               controlsAndTemplates,
               children.children
            );
         }
      }
   }

   /**
    * Returns changed node without relying on root stack.
    * When lifecycle hooks get called nodes from different roots get mixed in one synchronization.
    * This will not be fixed in foreseeable future, so we have to search for the node across all roots.
    */
   private findUncommittedNode(
      id: IBackendControlNode['id']
   ): IChangedNode | void {
      for (const root of Array.from(this.changedRoots.values())) {
         if (root.has(id)) {
            return root.get(id);
         }
      }
   }

   onStartLifecycle(node: IControlNode): void {
      const id = this.getNodeId(node);
      const changedNode = this.findUncommittedNode(id);

      if (changedNode) {
         changedNode.node.selfStartTime = performance.now();
         startMark(changedNode.node.name, changedNode.node.id);
         this.componentsStack.push(changedNode.node.id);
      } else {
         throw new Error(
            `Trying to mark the start of a lifecycle method of a node that was not changed during this synchronization. Node id: ${id}.`
         );
      }
   }

   onEndLifecycle(node: IControlNode): void {
      const id = this.getNodeId(node);
      const changedNode = this.findUncommittedNode(id);

      if (changedNode) {
         const lifecycleDuration =
            performance.now() - changedNode.node.selfStartTime;
         changedNode.node.selfDuration += lifecycleDuration;
         changedNode.node.lifecycleDuration = lifecycleDuration;
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
         throw new Error(
            `Trying to mark the end of a lifecycle method of a node that was not changed during this synchronization. Node id: ${id}.`
         );
      }
   }

   onEndSync(rootId: number): void {
      const changes = this.changedRoots.get(rootId);
      if (!changes) {
         throw new Error(
            `The synchronization for the root with the id: ${rootId} was never started.`
         );
      }
      endSyncMark(rootId);
      if (this.isProfiling) {
         /*
         Because observer calls callback asynchronously there is no guarantee that every change was handled.
         We should manually take records from the queue and pass them to the callback.
          */
         this.mutationObserverCallback(this.mutationObserver.takeRecords());
      }
      changes.forEach(({ operation, node }) => {
         node.selfDuration -= node.treeDuration;
         switch (operation) {
            case OperationType.DELETE:
               this.handleRemove(node);
               break;
            case OperationType.CREATE:
               this.handleAdd(node);
               break;
            case OperationType.UPDATE:
               this.handleUpdate(node);
               break;
         }
         this.addProfilingData(node, operation);
      });
      this.deletedChildrenIds.forEach((childId) => {
         const node = this.elements.get(childId);
         if (node) {
            this.handleRemove(node);
            this.deletedChildrenIds.delete(childId);
         }
      });
      const id = guid();
      if (this.isProfiling) {
         this.changedNodesBySynchronization.set(id, changes);
         this.cleanupMutationObserver();
      }
      if (this.isDevtoolsOpened) {
         window.__WASABY_DEV_HOOK__.pushMessage('endSynchronization', id);
         this.channel.dispatch('longMessage');
      }
      this.changedRoots.delete(rootId);
      this.rootStack.splice(this.rootStack.indexOf(rootId), 1);
      this.errorWrapper.resetErrors();
   }

   private handleAdd(node: IBackendControlNode): void {
      this.elements.set(node.id, node);

      const children = this.idToChildrenVNodes.get(node.id);

      if (children) {
         this.idToChildrenIds.set(
            node.id,
            this.transformVNodesSetToIdSet(children)
         );
         this.idToChildrenVNodes.delete(node.id);
      }

      if (this.isDevtoolsOpened) {
         this.constructCreateMessage(node);
      }
   }

   private handleUpdate(node: IBackendControlNode): void {
      if (!this.elements.has(node.id)) {
         this.handleAdd(node);
         return;
      }
      this.elements.set(node.id, node);

      const newChildren = this.idToChildrenVNodes.get(node.id);

      if (newChildren) {
         const newChildrenIds = this.transformVNodesSetToIdSet(newChildren);
         const oldChildrenIds = this.idToChildrenIds.get(node.id);
         if (oldChildrenIds) {
            oldChildrenIds.forEach((childId) => {
               if (!newChildrenIds.has(childId)) {
                  this.deletedChildrenIds.add(childId);
               }
            });
         }
         this.idToChildrenIds.set(node.id, newChildrenIds);
         this.idToChildrenVNodes.delete(node.id);
      }

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [
            OperationType.UPDATE,
            node.id
         ];
         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      }
   }

   private handleRemove(node: IBackendControlNode): void {
      this.removeChildren(node.id);
      this.removeNode(node);
   }

   private removeChildren(id: IBackendControlNode['id']): void {
      const childrenIds = this.idToChildrenIds.get(id);
      if (childrenIds) {
         childrenIds.forEach((childId) => {
            const child = this.elements.get(childId);
            if (child) {
               this.deletedChildrenIds.delete(childId);
               this.removeChildren(childId);
               this.removeNode(child);
            }
         });
      }
   }

   private removeNode({ id, parentId, instance }: IBackendControlNode): void {
      if (typeof parentId !== 'undefined') {
         this.idToParentId.delete(id);
         const siblings = this.idToChildrenIds.get(parentId) as Set<
            IBackendControlNode['id']
         >;
         siblings.delete(id);
         this.deletedChildrenIds.delete(id);
      }
      if (instance) {
         this.instanceToId.delete(instance);
      }
      this.idToChildrenVNodes.delete(id);
      this.idToChildrenIds.delete(id);
      this.elements.delete(id);

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [OperationType.DELETE, id];
         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      }
   }

   private transformVNodesSetToIdSet(
      nodes: Set<IControlNode | ITemplateNode>
   ): Set<IBackendControlNode['id']> {
      const result: Set<IBackendControlNode['id']> = new Set();
      nodes.forEach((node) => {
         result.add(this.getNodeId(node));
      });
      return result;
   }

   private inspectElement(options: {
      id: IBackendControlNode['id'];
      expandedTabs: ('attributes' | 'state' | 'options' | 'events')[];
      path?: (string | number)[];
   }): void {
      const { id, expandedTabs } = options;
      const sameId = this.currentInspectedElementId === id;
      this.currentInspectedElementId = id;
      const node = this.elements.get(id);
      if (node) {
         if (options.path) {
            this.updateInspectedPaths(options.path);
            let value;
            if (options.path[0] === 'events') {
               value = dehydrateHelper(
                  getValueByPath(
                     getEvents(this.elements, this.instanceToId, id),
                     options.path.slice(1)
                  ) as object,
                  this.currentInspectedPaths,
                  options.path
               );
            } else {
               value = dehydrateHelper(
                  getValueByPath(node, options.path) as object,
                  this.currentInspectedPaths,
                  options.path
               );
               // we should remember the state the first time, so we can use it later for diffing
               if (
                  !!node.instance &&
                  options.path.length === 1 &&
                  options.path[0] === 'state'
               ) {
                  this.selectedNodePreviousState = deepClone(node.state);
               }
            }
            window.__WASABY_DEV_HOOK__.pushMessage('inspectedElement', {
               id,
               value,
               type: 'path',
               path: options.path
            });
            this.channel.dispatch('longMessage');
         } else {
            if (sameId) {
               const result: IInspectedElement = {
                  isControl: !!node.instance
               };
               let hasChanges = false;
               expandedTabs.forEach((tabName) => {
                  switch (tabName) {
                     case 'attributes':
                        if (node.changedAttributes) {
                           hasChanges = true;
                           result.changedAttributes = dehydrateHelper(
                              node.changedAttributes,
                              this.currentInspectedPaths,
                              ['attributes']
                           );
                           node.changedAttributes = undefined;
                        }
                        break;
                     case 'state':
                        if (result.isControl) {
                           const changedState = getObjectDiff(
                              this.selectedNodePreviousState,
                              node.state
                           );
                           if (changedState) {
                              hasChanges = true;
                              result.changedState = dehydrateHelper(
                                 changedState,
                                 this.currentInspectedPaths,
                                 ['state']
                              );
                              this.selectedNodePreviousState = deepClone(
                                 node.state
                              );
                           }
                        }
                        break;
                     case 'options':
                        if (node.changedOptions) {
                           hasChanges = true;
                           result.changedOptions = dehydrateHelper(
                              node.changedOptions,
                              this.currentInspectedPaths,
                              ['options']
                           );
                           node.changedOptions = undefined;
                        }
                        break;
                  }
               });
               if (hasChanges) {
                  window.__WASABY_DEV_HOOK__.pushMessage('inspectedElement', {
                     id,
                     type: 'partial',
                     value: result
                  });
                  this.channel.dispatch('longMessage');
               } else {
                  this.channel.dispatch('inspectedElement', {
                     id,
                     type: 'no-change'
                  });
               }
            } else {
               this.currentInspectedPaths.clear();
               expandedTabs.forEach((tab) => {
                  this.currentInspectedPaths.set(tab, new Map());
               });
               const result: IInspectedElement = {
                  attributes: dehydrateHelper(
                     node.attributes,
                     this.currentInspectedPaths,
                     ['attributes']
                  ),
                  state: dehydrateHelper(
                     node.state,
                     this.currentInspectedPaths,
                     ['state']
                  ),
                  options: dehydrateHelper(
                     node.options,
                     this.currentInspectedPaths,
                     ['options']
                  ),
                  events: dehydrateHelper(
                     getEvents(this.elements, this.instanceToId, id),
                     this.currentInspectedPaths,
                     ['events']
                  ),
                  isControl: !!node.instance
               };
               this.selectedNodePreviousState =
                  result.isControl && expandedTabs.includes('state')
                     ? deepClone(node.state)
                     : undefined;

               window.__WASABY_DEV_HOOK__.pushMessage('inspectedElement', {
                  id,
                  type: 'full',
                  value: result
               });
               this.channel.dispatch('longMessage');
            }
         }

         window.$wasaby = { ...node };
      } else {
         this.channel.dispatch('inspectedElement', {
            id,
            type: 'not-found'
         });
         delete window.$wasaby;
      }
   }

   private updateInspectedPaths(path: (string | number)[]): void {
      let currentPathMap = this.currentInspectedPaths;
      path.forEach((part) => {
         let nextPathMap = currentPathMap.get(part);
         if (!nextPathMap) {
            nextPathMap = new Map();
            currentPathMap.set(part, nextPathMap);
         }
         currentPathMap = nextPathMap;
      });
   }

   private viewTemplate(id: IBackendControlNode['id']): void {
      const node = this.elements.get(id);
      if (node) {
         window.__WASABY_DEV_HOOK__.__template = node.template;
      }
   }

   private viewConstructor(id: IBackendControlNode['id']): void {
      const node = this.elements.get(id);
      if (node && node.instance) {
         window.__WASABY_DEV_HOOK__.__constructor = node.instance.constructor;
      }
   }

   private viewContainer(id: IBackendControlNode['id']): void {
      const node = this.elements.get(id);
      if (node && node.containers) {
         window.__WASABY_DEV_HOOK__.__container = node.containers[0];
      }
   }

   private viewFunctionSource({
      id,
      path
   }: {
      id: IBackendControlNode['id'];
      path: (string | number)[];
   }): void {
      window.__WASABY_DEV_HOOK__.__function = this.getValueByPath(
         id,
         path
      ) as Function;
   }

   private storeAsGlobal({
      id,
      path
   }: {
      id: IBackendControlNode['id'];
      path: (string | number)[];
   }): void {
      window.$tmp = this.getValueByPath(id, path);
      // tslint:disable-next-line: no-console
      console.log('$tmp = ', window.$tmp);
   }

   private getValueByPath(
      id: IBackendControlNode['id'],
      path: (string | number)[]
   ): unknown {
      const currentProperty = path.pop();
      let value;
      if (currentProperty === 'events') {
         value = getEvents(this.elements, this.instanceToId, id);
      } else {
         const element = this.elements.get(id) as IBackendControlNode;
         value = element[currentProperty as keyof IBackendControlNode];
      }
      return getValueByPath(value as object | null, path);
   }

   private highlightElement(id?: IBackendControlNode['id']): void {
      if (typeof id !== 'undefined') {
         const node = this.elements.get(id);
         if (node && node.containers) {
            this.highlighter.highlightElement(node.containers, node.name);
            return;
         }
      }
      this.highlighter.highlightElement();
   }

   private toggleSelectFromPage(state: boolean): void {
      if (state) {
         this.highlighter.startSelectingFromPage();
      } else {
         this.highlighter.stopSelectingFromPage();
      }
   }

   private selectByDomNode(elem: IWasabyElement): void {
      const control = findControlByDomNode(elem, this.domToIds, this.elements);
      if (control) {
         this.channel.dispatch('setSelectedItem', control.id);
      } else {
         this.channel.dispatch('stopSelectFromPage');
      }
   }

   private getSelectedItem(): void {
      const node =
         findControlByDomNode(
            window.__WASABY_DEV_HOOK__.$0,
            this.domToIds,
            this.elements
         ) || this.elements.values().next().value;
      if (node && this.idClosestToPreviousSelectedElement !== node.id) {
         this.channel.dispatch('setSelectedItem', node.id);
         this.idClosestToPreviousSelectedElement = node.id;
      }
   }

   private toggleProfiling(state: boolean = !this.isProfiling): void {
      this.isProfiling = state;
      if (state) {
         this.changedNodesBySynchronization.clear();
         this.initialIdToDuration.clear();
         this.elements.forEach(({ id, selfDuration }) => {
            this.initialIdToDuration.set(id, selfDuration);
         });
      }
      this.cleanupMutationObserver();
      this.channel.dispatch('profilingStatus', this.isProfiling);
   }

   private getProfilingStatus(): void {
      this.channel.dispatch('profilingStatus', this.isProfiling);
   }

   private getProfilingData(): void {
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
   private cleanupMutationObserver(): void {
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
   private mutationObserverCallback(mutations: MutationRecord[]): void {
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

   private getNodeId(node?: object): number {
      if (node) {
         if (this.vNodeToId.has(node)) {
            return this.vNodeToId.get(node) as number;
         } else if (this.vNodeToId.has(node.vnode)) {
            return this.vNodeToId.get(node.vnode) as number;
         } else {
            throw new Error(
               'startCommit for this node was called several times in a row without calling endCommit.'
            );
         }
      }
      return getNodeId();
   }

   private getCurrentRoot(): Map<IBackendControlNode['id'], IChangedNode> {
      const currentRootId = this.rootStack[this.rootStack.length - 1];
      const currentRoot = this.changedRoots.get(currentRootId);
      if (!currentRoot) {
         throw new Error('Trying to change nonexistent root');
      }
      return currentRoot;
   }

   private getParentId(
      node: IControlNode | ITemplateNode
   ): IBackendControlNode['parentId'] {
      return (
         this.vNodeToParentId.get(node) ?? this.vNodeToParentId.get(node.vnode)
      );
   }

   private getLogicParentId(
      data?: ITemplateChanges | IControlChanges
   ): IBackendControlNode['logicParentId'] {
      return data && data.logicParent
         ? this.instanceToId.get(data.logicParent)
         : undefined;
   }

   private addProfilingData(
      node: IBackendControlNode,
      operation: OperationType
   ): void {
      if (this.isProfiling) {
         switch (operation) {
            case OperationType.CREATE:
               node.domChanged = true;
               node.isVisible = node.containers
                  ? node.containers.some((elem) => isVisible(elem))
                  : true;
               break;
            case OperationType.UPDATE:
               node.domChanged = this.dirtyControls.has(node.id);
               node.isVisible = node.containers
                  ? node.containers.some((elem) => isVisible(elem))
                  : true;
               break;
         }
      }
   }

   /**
    * Performs the cleanup on devtools closure. Stops sending events, disables selection from the page.
    * @private
    */
   private onDevtoolsClosed(): void {
      this.hasFullTree = false;
      this.isDevtoolsOpened = false;
      this.toggleSelectFromPage(false);
   }

   /**
    * Constructs array of event handlers and saves it on the hook. Each item of the array is a tuple which declaration can be found in IHook.d.ts.
    * Includes event handlers of the control with the passed id and its' ancestors.
    * @param id Id of the first control to which breakpoints will be added.
    * @param eventName Name of the event which will be handled.
    * @private
    */
   private setBreakpoint({
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
         const eventHandlers = getEvents(
            this.elements,
            this.instanceToId,
            currentId,
            true
         )[eventName];
         if (eventHandlers) {
            eventHandlers.forEach((handler) => {
               const control = handler.controlNode.instance;
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
                     breakpoints.push([
                        handler.function,
                        getCondition(eventName, handler.controlNode.id),
                        handler.controlNode.id,
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

   private constructCreateMessage(node: IBackendControlNode): void {
      const message: IOperationEvent['args'] = [
         OperationType.CREATE,
         node.id,
         node.name,
         getControlType(node)
      ];
      if (typeof node.parentId !== 'undefined') {
         message.push(node.parentId);
      }
      if (typeof node.logicParentId !== 'undefined') {
         message.push(node.logicParentId);
      }
      window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
   }
}

export default Agent;
