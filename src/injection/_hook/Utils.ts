import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import Agent, {
   IChangedNode} from './Agent';
import {
   IChangesDescription,
   IControlNode,
   IProfilingData,
   ISynchronizationDescription
} from 'Extension/Plugins/Elements/IControlNode';

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

export function startMark(name: string, operation: OperationType): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      performance.mark(`${name} (${operationToString(operation)} start)`);
   }
}

export function endMark(name: string, operation: OperationType): void {
   if (
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   ) {
      const prettifiedOperation = operationToString(operation);
      performance.mark(`${name} (${prettifiedOperation} end)`);
      performance.measure(
         `${name} (${prettifiedOperation})`,
         `${name} (${prettifiedOperation} start)`,
         `${name} (${prettifiedOperation} end)`
      );
      performance.clearMarks(`${name} (${prettifiedOperation} start)`);
      performance.clearMarks(`${name} (${prettifiedOperation} end)`);
      performance.clearMeasures(`${name} (${prettifiedOperation})`);
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

export function getControlType(node: IControlNode): ControlType {
   if (node.instance) {
      return typeof node.options === 'object' && node.options.content
         ? ControlType.HOC
         : ControlType.CONTROL;
   }
   return ControlType.TEMPLATE;
}

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

function getChangesDescription({ operation, node }: IChangedNode): IChangesDescription {
   return {
      isFirstRender: operation === OperationType.CREATE,
      changedOptions: processChanges(node.changedOptions),
      changedAttributes: processChanges(node.changedAttributes),
      selfDuration: node.selfDuration
   };
}

function getChanges(
   changedNodesEntries: Array<[IControlNode['id'], IChangedNode]>
): ISynchronizationDescription['changes'] {
   return changedNodesEntries.map(([commitKey, changedNode]) => {
      return [commitKey, getChangesDescription(changedNode)];
   });
}

function getSynchronizationDuration(
   changedNodesEntries: Array<[IControlNode['id'], IChangedNode]>
): number {
   return changedNodesEntries.reduce((acc, [key, changes]) => {
      return acc + changes.node.selfDuration;
   }, 0);
}

export function getSyncList(
   changedNodesMap: Agent['changedNodesBySynchronization']
): IProfilingData['syncList'] {
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
