/**
 * Contains utility functions used by profiler.
 * @author Зайцев А.С.
 */
import { applyOperation, Store } from 'Elements/elements';
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

/**
 * Returns background color corresponding to the duration of an operation.
 * @param value Duration of an operation.
 * @return Background color corresponding to the duration of an operation.
 */
export function getBackgroundColorBasedOnTiming(value: number): number {
   const NUMBER_OF_COLORS = 9;
   const index =
      Math.max(0, Math.min(NUMBER_OF_COLORS - 1, value)) *
      (NUMBER_OF_COLORS - 1);
   return Math.round(index);
}

/**
 * Returns background class corresponding to the update reason.
 * @param updateReason Reason for the update.
 * @param hasChangesInSubtree Whether control and its subtree took part in a synchronization.
 * @return Background class corresponding to the update reason.
 */
export function getBackgroundClassBasedOnReason(
   updateReason: ControlUpdateReason,
   hasChangesInSubtree: boolean = true
): string {
   if (!hasChangesInSubtree) {
      return 'devtools-reason_background_noChangesInSubtree';
   }
   return `devtools-reason_background_${updateReason}`;
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

/**
 * Stringifies profiling data.
 * @param synchronizationKeyToDescription
 * @param snapshotBySynchronization
 * @param destroyedCountBySynchronization
 */
export function stringifyProfilingData(
   synchronizationKeyToDescription: Profiler['_profilingData']['synchronizationKeyToDescription'],
   snapshotBySynchronization: Profiler['_snapshotBySynchronization'],
   destroyedCountBySynchronization: Profiler['_destroyedCountBySynchronization']
): string {
   const result = {
      syncList: Array.from(synchronizationKeyToDescription).map(
         ([key, { selfDuration, changes }]) => {
            return [
               key,
               {
                  selfDuration,
                  changes: Array.from(changes)
               }
            ];
         }
      ),
      snapshotBySynchronization: Array.from(snapshotBySynchronization),
      destroyedCountBySynchronization: Array.from(
         destroyedCountBySynchronization
      )
   };

   return JSON.stringify(result);
}
