/**
 * Contains utility functions used by agent.
 * @author Зайцев А.С.
 */
import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import Agent, { IChangedNode } from './Agent';
import {
   IBackendControlNode,
   IControlNode,
   ITemplateNode,
   IWasabyElement
} from 'Extension/Plugins/Elements/IControlNode';
import {
   IBackendProfilingData,
   IBackendSynchronizationDescription,
   IChangesDescription
} from 'Extension/Plugins/Elements/IProfilingData';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import isDeepEqual from './isDeepEqual';

function operationToString(
   operation?: OperationType
): 'mount' | 'update' | 'unmount' | 'reorder' | 'lifecycle' {
   switch (operation) {
      case OperationType.DELETE:
         return 'unmount';
      case OperationType.CREATE:
         return 'mount';
      case OperationType.REORDER:
         return 'reorder';
      case OperationType.UPDATE:
         return 'update';
      default:
         return 'lifecycle';
   }
}

function getCaption(name: string, operation?: OperationType): string {
   return `${name} (${operationToString(operation)})`;
}

export function startSyncMark(rootId: number): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      performance.mark(`Synchronization ${rootId}`);
   }
}

export function endSyncMark(rootId: number): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      performance.measure('Synchronization', `Synchronization ${rootId}`);
   }
}

export function startMark(
   name: string,
   id: IBackendControlNode['id'],
   operation?: OperationType
): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      performance.mark(`${getCaption(name, operation)} ${id}`);
   }
}

export function endMark(
   name: string,
   id: IBackendControlNode['id'],
   operation?: OperationType
): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      const caption = getCaption(name, operation);
      const label = `${caption} ${id}`;
      performance.measure(caption, label);
      performance.clearMarks(label);
      performance.clearMeasures(caption);
   }
}

export function getControlType(node: IBackendControlNode): ControlType {
   if (node.instance) {
      return typeof node.options === 'object' && node.options.content
         ? ControlType.HOC
         : ControlType.CONTROL;
   }
   return ControlType.TEMPLATE;
}

function processChanges(value?: object): string[] | undefined {
   let result;
   if (value) {
      result = Object.keys(value).map((key) => {
         return key.replace('attr:', '');
      });
   }
   return result;
}

function getUpdateReason(
   { operation, node }: IChangedNode,
   parentUpdated: boolean = false
): Exclude<ControlUpdateReason, 'unchanged'> {
   if (operation === OperationType.CREATE) {
      return 'mounted';
   }

   if (operation === OperationType.DELETE) {
      return 'destroyed';
   }

   if (node.changedOptions || node.changedAttributes) {
      return 'selfUpdated';
   }

   if (parentUpdated) {
      return 'parentUpdated';
   }

   return 'forceUpdated';
}

function getChangesDescription(
   changedNode: IChangedNode,
   changedNodesMap: Map<IBackendControlNode['id'], IChangedNode>
): IChangesDescription {
   const { node }: IChangedNode = changedNode;
   return {
      updateReason: getUpdateReason(
         changedNode,
         typeof node.parentId === 'number' && changedNodesMap.has(node.parentId)
      ),
      changedOptions: processChanges(node.changedOptions),
      changedAttributes: processChanges(node.changedAttributes),
      selfDuration: node.selfDuration,
      domChanged: !!node.domChanged,
      isVisible: !!node.isVisible,
      unusedReceivedState: !!node.unusedReceivedState
   };
}

function getChanges(
   changedNodesEntries: Array<[IBackendControlNode['id'], IChangedNode]>,
   changedNodesMap: Map<IBackendControlNode['id'], IChangedNode>
): IBackendSynchronizationDescription['changes'] {
   return changedNodesEntries.map(([commitKey, changedNode]) => {
      return [commitKey, getChangesDescription(changedNode, changedNodesMap)];
   });
}

function getSynchronizationDuration(
   changedNodesEntries: Array<[IBackendControlNode['id'], IChangedNode]>
): number {
   return changedNodesEntries.reduce((acc, [_, changes]) => {
      return acc + changes.node.selfDuration;
   }, 0);
}

export function getSyncList(
   changedNodesMap: Agent['changedNodesBySynchronization']
): IBackendProfilingData['syncList'] {
   return Array.from(changedNodesMap.entries()).map(([key, value]) => {
      const entries = Array.from(value.entries());
      return [
         key,
         {
            selfDuration: getSynchronizationDuration(entries),
            changes: getChanges(entries, value)
         }
      ];
   });
}

export function getObjectDiff(
   obj1?: object,
   obj2?: object
): object | undefined {
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

export function isControlNode(node: object): node is IControlNode {
   return node.hasOwnProperty('controlClass');
}

export function isTemplateNode(node: object): node is ITemplateNode {
   return node.type === 'TemplateNode';
}

export function addRef(
   changedNode: IChangedNode,
   ...oldRefs: Array<Function | undefined>
): Function {
   return (element?: Element) => {
      oldRefs.forEach((ref) => {
         if (ref) {
            ref(element);
         }
      });
      changedNode.node.container = element as IWasabyElement;
   };
}

export function getContainerForNode(node: IBackendControlNode): IWasabyElement {
   if (node.container) {
      return node.container;
   }
   if (node.instance && node.instance._container) {
      return node.instance._container;
   }
   return document.body;
}

function isParentVisible(element: HTMLElement): boolean {
   const parent = element.parentElement;
   if (parent) {
      return isVisible(parent);
   } else {
      return true;
   }
}

export function isVisible(element: HTMLElement): boolean {
   if (
      element === document.documentElement ||
      element === document.body ||
      element.offsetParent !== null
   ) {
      return true;
   }

   const style = getComputedStyle(element);
   if (style.position === 'fixed') {
      return style.display !== 'none' && isParentVisible(element);
   }
   if (style.display === 'contents') {
      return isParentVisible(element);
   }

   return false;
}

/**
 * Finds the controlNode to which the control belongs to.
 * @param control Control which controlNode we're trying to get.
 * @return The controlNode to which the control belongs to.
 */
function getControlNode(control: IControlNode['instance']): IControlNode {
   return control._container.controlNodes.find(
      (node) => node.control === control
   ) as IControlNode;
}

/**
 * For templates, returns every event handler. For controls, returns every event which is handled by this control.
 * Actually, not every event handled by the control is returned, only events for the control's container.
 * Devtools take information about events from the DOM elements, and there's no fast way to collect this information and keep it updated.
 * @param elements
 * @param id
 * @param needControlNode
 */
export function getEvents(
   elements: Agent['elements'],
   id: IBackendControlNode['id'],
   needControlNode?: false
): Record<string, Array<{ function: Function; arguments: unknown[] }>>;
export function getEvents(
   elements: Agent['elements'],
   id: IBackendControlNode['id'],
   needControlNode?: true
): Record<
   string,
   Array<{
      function: Function;
      arguments: unknown[];
      controlNode: IControlNode;
   }>
>;
export function getEvents(
   elements: Agent['elements'],
   id: IBackendControlNode['id'],
   needControlNode: boolean = false
): ReturnType<typeof getEvents> {
   const EVENT_NAME_OFFSET = 3;
   const node = elements.get(id);
   const events: ReturnType<typeof getEvents> = {};
   if (node && node.container.eventProperties) {
      const eventProperties = node.container.eventProperties;
      Object.keys(eventProperties).forEach((key) => {
         let properties = eventProperties[key];
         if (node.instance) {
            properties = properties.filter(
               (handler) => handler.fn.control === node.instance
            );
         }
         const result = properties.map((handler) => {
            const userHandler = handler.fn.control[handler.value];
            return {
               function: userHandler ? userHandler : handler.fn,
               arguments: handler.args,
               controlNode: needControlNode
                  ? getControlNode(handler.fn.control)
                  : undefined
            };
         });
         if (result.length) {
            events[key.slice(EVENT_NAME_OFFSET)] = result;
         }
      });
   }
   return events;
}

/**
 * Constructs a condition for usage as a second argument to debug function.
 * @param name Name of the event.
 * @param id Id of a control to which method breakpoint will be added.
 */
export function getCondition(
   name: string,
   id: IBackendControlNode['id']
): string {
   const ctrl = `window.__WASABY_DEV_HOOK__._agent.elements.get(${id}).instance`;
   return `(arguments.length === 0 || arguments[0].type === "${name}") && (this === ${ctrl} || this.data === ${ctrl})`;
}
