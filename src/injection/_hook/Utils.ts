import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import Agent, { IChangedNode } from './Agent';
import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import {
   IBackendProfilingData,
   IBackendSynchronizationDescription,
   IChangesDescription
} from 'Extension/Plugins/Elements/IProfilingData';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

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

export function startSyncMark(rootId: string): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      performance.mark(`Synchronization ${rootId}`);
   }
}

export function endSyncMark(rootId: string): void {
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

export function updateParentDuration(
   currentRoot: Map<IBackendControlNode['id'], IChangedNode>,
   childDuration: number,
   componentsStack: Array<IBackendControlNode['id']>,
   parentId?: IBackendControlNode['parentId']
): void {
   if (typeof parentId !== 'undefined' && componentsStack.includes(parentId)) {
      const parent = currentRoot.get(parentId);
      if (parent) {
         parent.node.treeDuration += childDuration;
      }
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
      domChanged: node.domChanged
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
   return changedNodesEntries.reduce((acc, [key, changes]) => {
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
