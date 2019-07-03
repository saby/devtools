import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import { IChangedNode } from './Agent';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';

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
   unfinishedNodes.forEach((node) => {
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
