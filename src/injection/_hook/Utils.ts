import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import Agent, { IChangedNode } from './Agent';
import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import {
   IBackendProfilingData,
   IBackendSynchronizationDescription,
   IChangesDescription
} from 'Extension/Plugins/Elements/IProfilingData';

function operationToString(
   operation: OperationType
): 'mount' | 'update' | 'unmount' | 'reorder' {
   switch (operation) {
      case OperationType.DELETE:
         return 'unmount';
      case OperationType.CREATE:
         return 'mount';
      case OperationType.REORDER:
         return 'reorder';
      case OperationType.UPDATE:
         return 'update';
   }
}

function getCaption(name: string, operation: OperationType): string {
   return `${name} (${operationToString(operation)})`;
}

export function startSync(rootId: string): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      performance.mark(`Synchronization ${rootId}`);
   }
}

export function endSync(rootId: string): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      performance.measure('Synchronization', `Synchronization ${rootId}`);
   }
}

export function startMark(
   name: string,
   operation: OperationType,
   id: IBackendControlNode['id']
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
   operation: OperationType,
   id: IBackendControlNode['id']
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

export function updateSelfDurations(
   unfinishedNodes: Set<IChangedNode>,
   childDuration: number
): void {
   unfinishedNodes.forEach(({ node }) => {
      node.selfDuration -= childDuration;
   });
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

function getChangesDescription({
   operation,
   node
}: IChangedNode): IChangesDescription {
   return {
      isFirstRender: operation === OperationType.CREATE,
      changedOptions: processChanges(node.changedOptions),
      changedAttributes: processChanges(node.changedAttributes),
      selfDuration: node.selfDuration
   };
}

function getChanges(
   changedNodesEntries: Array<[IBackendControlNode['id'], IChangedNode]>
): IBackendSynchronizationDescription['changes'] {
   return changedNodesEntries.map(([commitKey, changedNode]) => {
      return [commitKey, getChangesDescription(changedNode)];
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
            changes: getChanges(entries)
         }
      ];
   });
}
