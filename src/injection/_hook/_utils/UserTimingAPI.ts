/**
 * Contains utility functions used to work with the User Timing API.
 * @author Зайцев А.С.
 */
import { OperationType } from 'Extension/Plugins/Elements/const';
import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';

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

function useUserTimingAPI(): boolean {
   return !!(
      window.wasabyDevtoolsOptions &&
      window.wasabyDevtoolsOptions.useUserTimingAPI
   );
}

export function startSyncMark(rootId: number): void {
   if (useUserTimingAPI()) {
      performance.mark(`Synchronization ${rootId}`);
   }
}

export function endSyncMark(rootId: number): void {
   if (useUserTimingAPI()) {
      performance.measure('Synchronization', `Synchronization ${rootId}`);
   }
}

export function startMark(
   name: string,
   id: IBackendControlNode['id'],
   operation?: OperationType
): void {
   if (useUserTimingAPI()) {
      performance.mark(`${getCaption(name, operation)} ${id}`);
   }
}

export function endMark(
   name: string,
   id: IBackendControlNode['id'],
   operation?: OperationType
): void {
   if (useUserTimingAPI()) {
      const caption = getCaption(name, operation);
      const label = `${caption} ${id}`;
      performance.measure(caption, label);
      performance.clearMarks(label);
      performance.clearMeasures(caption);
   }
}
