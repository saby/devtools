/**
 * Contains utility functions used by the backend during profiling.
 * @author Зайцев А.С.
 */
import Agent, { IChangedNode } from '../Agent';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import {
   IBackendProfilingData,
   IBackendSynchronizationDescription,
   IChangesDescription
} from 'Extension/Plugins/Elements/IProfilingData';
import { parseStacksOfReactiveProps } from './parseStacksOfReactiveProps';

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
   parentUpdated: boolean
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
      changedReactiveProps: parseStacksOfReactiveProps(
         node.changedReactiveProps
      ),
      selfDuration: node.selfDuration,
      lifecycleDuration: node.lifecycleDuration,
      domChanged: !!node.domChanged,
      isVisible: !!node.isVisible,
      unusedReceivedState: !!node.unusedReceivedState,
      asyncControl: !!node.asyncControl
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

/**
 * Transforms information about the synchronizations from the backend to a format consumed by the frontend.
 * @param changedNodesMap
 */
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
