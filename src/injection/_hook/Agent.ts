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
   endSync,
   getControlType,
   getSyncList,
   startMark,
   startSync,
   updateSelfDurations
} from './Utils';
import Highlighter from './Highlighter';
import { IWasabyDevHook } from './IHook';
import { IBackendProfilingData } from 'Extension/Plugins/Elements/IProfilingData';
import isDeepEqual from './isDeepEqual';
import deepClone from './deepClone';

export interface IChangedNode {
   node: IBackendControlNode;
   operation: OperationType;
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

   private unfinishedNodes: Set<IChangedNode> = new Set();

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
      startSync(rootId);
   }

   onStartCommit(node: IBackendControlNode, operation: OperationType): void {
      const currentRootId = this.rootStack[this.rootStack.length - 1];
      const currentRoot = this.changedRoots.get(currentRootId);
      if (!currentRoot) {
         throw new Error('Trying to change nonexistent root');
      }

      this.currentModuleName = node.name;
      const id = node.id + currentRootId;
      startMark(node.name, operation, id);

      currentRoot.set(id, {
         node: {
            ...node,
            selfStartTime: performance.now(),
            selfDuration: 0
         },
         operation
      });
      this.unfinishedNodes.add(currentRoot.get(id) as IChangedNode);
   }

   onEndCommit(node: IBackendControlNode): void {
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
         changedNode.node.selfDuration +
         performance.now() -
         changedNode.node.selfStartTime;

      endMark(changedNode.node.name, changedNode.operation, id);

      this.unfinishedNodes.delete(changedNode);
      changedNode.node = {
         ...changedNode.node,
         ...node,
         id,
         selfDuration,
         parentId: changedNode.node.parentId
            ? changedNode.node.parentId + currentRootId
            : undefined
      };

      updateSelfDurations(this.unfinishedNodes, selfDuration);
   }

   onEndSync(rootId: string): void {
      const changes = this.changedRoots.get(rootId);
      if (!changes) {
         throw new Error('Trying to change nonexistent root');
      }
      endSync(rootId);
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
                  window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
               }
            }
         });
      }

      if (this.isDevtoolsOpened) {
         const message: IOperationEvent['args'] = [
            OperationType.DELETE,
            node.id
         ];
         window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
      }
   }

   private __removeChildren(id: IBackendControlNode['id']): void {
      const parents: Array<IBackendControlNode['parentId']> = [];
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
            window.__WASABY_DEV_HOOK__.pushMessage('operation', message);
         }
      });
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
      if (node && node.instance) {
         window.__WASABY_DEV_HOOK__.__container = node.instance._container;
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
         if (node && node.instance && node.instance._container) {
            this.highlighter.highlightElement(
               node.instance._container,
               node.name
            );
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
      element: IWasabyElement
   ): IBackendControlNode | undefined {
      let currentElement = element;

      /*
      TODO: сейчас на странице могут быть элементы с одинаковыми ключами,
      для этого я к ключу каждого элемента добавляю id корня, в котором он находится
      Потом ключи будут браться из инферно и будут уникальными, и все костыли с приклеиванием rootId можно будет убрать
       */
      function getRootId(elem: IWasabyElement): string {
         let currentRoot: IWasabyElement | null = elem;
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
            currentRoot = currentRoot.parentElement as IWasabyElement;
         }
         return '_inst_1';
      }
      const rootId = getRootId(element);

      while (currentElement) {
         if (currentElement.controlNodes) {
            if (
               this.idClosestToPreviousSelectedElement &&
               currentElement.controlNodes.find(
                  (node) =>
                     node.key + rootId ===
                     this.idClosestToPreviousSelectedElement
               )
            ) {
               return this.elements.get(
                  this.idClosestToPreviousSelectedElement
               );
            }
            return this.elements.get(
               currentElement.controlNodes[
                  currentElement.controlNodes.length - 1
               ].key + rootId
            );
         }
         currentElement = currentElement.parentElement as IWasabyElement;
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
      /*
      TODO: пока только для контролов, потому что я не имею доступа к контейнерам шаблонов
       */
      const EVENT_NAME_OFFSET = 3;
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
               if (node.instance) {
                  // ts for some reason forgets about previous check
                  events[
                     key.slice(EVENT_NAME_OFFSET)
                  ] = node.instance._container.eventProperties[key].map(
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
               }
            }
         );
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
}

export default Agent;
