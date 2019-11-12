import { Store, applyOperation } from 'Elements/elements';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import Profiler, { ISynchronizationOverview } from '../_Profiler/Profiler';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import {
   IBackendProfilingData,
   IChangesDescription,
   IFrontendProfilingData,
   IFrontendSynchronizationDescription
} from 'Extension/Plugins/Elements/IProfilingData';
import Flamegraph from '../_Flamegraph/Flamegraph';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

export function applyOperations(
   initialElements: Store['_elements'],
   operations: Profiler['_currentOperations']
): Store['_elements'] {
   const result = initialElements.slice();

   operations.forEach((args: IOperationEvent['args']) => {
      applyOperation(result, args);
   });

   return result;
}

export function convertProfilingData({
   initialIdToDuration,
   syncList
}: IBackendProfilingData): IFrontendProfilingData {
   const syncMap = new Map();

   syncList.forEach(([key, { selfDuration, changes }]) => {
      syncMap.set(key, {
         selfDuration,
         changes: new Map(changes)
      });
   });

   return {
      initialIdToDuration: new Map(initialIdToDuration),
      synchronizationKeyToDescription: syncMap
   };
}

export function getChanges(
   profilingData: IFrontendProfilingData,
   synchronizationId: string
): Map<IFrontendControlNode['id'], IChangesDescription> {
   return (profilingData.synchronizationKeyToDescription.get(
      synchronizationId
   ) as IFrontendSynchronizationDescription).changes;
}

export function getChangesDescription(
   profilingData: IFrontendProfilingData,
   synchronizationId: string,
   controlId: IFrontendControlNode['id']
): IChangesDescription | undefined {
   return getChanges(profilingData, synchronizationId).get(controlId);
}

export function getSelfDuration(
   profilingData: IFrontendProfilingData,
   synchronizationId: string,
   controlId: IFrontendControlNode['id']
): number {
   let changesDescription = getChangesDescription(
      profilingData,
      synchronizationId,
      controlId
   );

   if (changesDescription) {
      return changesDescription.selfDuration;
   } else {
      const synchronizationsKeys = Array.from(
         profilingData.synchronizationKeyToDescription.keys()
      );
      const startIndex = synchronizationsKeys.indexOf(synchronizationId);
      for (let i = startIndex; i >= 0; i--) {
         changesDescription = getChangesDescription(
            profilingData,
            synchronizationsKeys[i],
            controlId
         );

         if (changesDescription) {
            return changesDescription.selfDuration;
         }
      }

      return profilingData.initialIdToDuration.get(controlId) as number;
   }
}

export function getActualDurations(
   dataWithSelfDurations: Array<{
      id: IFrontendControlNode['id'];
      selfDuration: number;
      updateReason: ControlUpdateReason;
      parentId?: IFrontendControlNode['parentId'];
   }>,
   startId: IFrontendControlNode['id'],
   startIndex: number
): {
   actualDuration: number;
   actualBaseDuration: number;
} {
   let actualBaseDuration = dataWithSelfDurations[startIndex].selfDuration;
   let actualDuration =
      dataWithSelfDurations[startIndex].updateReason !== 'unchanged'
         ? dataWithSelfDurations[startIndex].selfDuration
         : 0;
   const parents: Set<IFrontendControlNode['id']> = new Set();
   parents.add(startId);

   for (let i = startIndex + 1; i < dataWithSelfDurations.length; i++) {
      const {
         id,
         parentId,
         updateReason,
         selfDuration
      }: {
         id: IFrontendControlNode['id'];
         selfDuration: number;
         updateReason: ControlUpdateReason;
         parentId?: IFrontendControlNode['parentId'];
      } = dataWithSelfDurations[i];
      if (typeof parentId !== 'undefined' && parents.has(parentId)) {
         parents.add(id);
         actualBaseDuration += selfDuration;
         if (updateReason !== 'unchanged') {
            actualDuration += selfDuration;
         }
      }
   }

   return {
      actualDuration,
      actualBaseDuration
   };
}

type BACKGROUND_COLOR =
   | '#e2e2e2'
   | '#baf7c8'
   | '#c4f1ba'
   | '#cdeaac'
   | '#d5e49e'
   | '#dbde90'
   | '#e1d782'
   | '#e6d174'
   | '#ebca66'
   | '#efc457';

const colors: Array<Exclude<BACKGROUND_COLOR, '#e2e2e2'>> = [
   '#baf7c8',
   '#c4f1ba',
   '#cdeaac',
   '#d5e49e',
   '#dbde90',
   '#e1d782',
   '#e6d174',
   '#ebca66',
   '#efc457'
];

/**
 * Returns background color corresponding to the duration of an operation.
 * @param value Duration of an operation.
 * @return Background color corresponding to the duration of an operation.
 */
export function getBackgroundColorBasedOnTiming(
   value: number
): Exclude<BACKGROUND_COLOR, '#e2e2e2'> {
   const index =
      Math.max(0, Math.min(colors.length - 1, value)) * (colors.length - 1);
   return colors[Math.round(index)];
}

/**
 * Returns background color corresponding to the update reason.
 * @param updateReason Reason for the update.
 * @return Background color corresponding to the update reason.
 */
export function getBackgroundColorBasedOnReason(
   updateReason: ControlUpdateReason
): '#e2e2e2' | '#ffab66' | '#e6d174' | '#b3e6e6' | '#000' | '#baf7c8' {
   switch (updateReason) {
      case 'mounted':
         return '#ffab66';
      case 'forceUpdated':
         return '#baf7c8';
      case 'selfUpdated':
         return '#e6d174';
      case 'parentUpdated':
         return '#b3e6e6';
      case 'unchanged':
         return '#e2e2e2';
      case 'destroyed':
         return '#000';
   }
}

/**
 * Converts a number to a string which represents duration. Rounds to seconds if necessary.
 * @param value Value to be converted.
 * @return String which represents duration.
 */
export function formatTime(value: number): string {
   const SECOND = 1000;
   const PRECISION = 2;
   if (value >= SECOND) {
      return `${(value / 1000).toFixed(PRECISION)}s`;
   } else {
      return `${value.toFixed(PRECISION)}ms`;
   }
}

/**
 * Counts how many times each operation happened during a synchronization and returns an object with results.
 * @param snapshot Snapshot of the synchronization.
 * @param destroyedCount Number of elements destroyed during the syncrhonization.
 * @return Object with results of the synchronization.
 */
export function getSynchronizationOverview(
   snapshot: Flamegraph['_options']['snapshot'],
   destroyedCount: number = 0
): ISynchronizationOverview {
   const result: ISynchronizationOverview = {
      mountedCount: 0,
      selfUpdatedCount: 0,
      parentUpdatedCount: 0,
      unchangedCount: 0,
      forceUpdatedCount: 0,
      destroyedCount
   };

   snapshot.forEach(({ updateReason }) => {
      switch (updateReason) {
         case 'mounted':
            result.mountedCount++;
            break;
         case 'selfUpdated':
            result.selfUpdatedCount++;
            break;
         case 'parentUpdated':
            result.parentUpdatedCount++;
            break;
         case 'unchanged':
            result.unchangedCount++;
            break;
         case 'forceUpdated':
            result.forceUpdatedCount++;
            break;
      }
   });

   return result;
}
