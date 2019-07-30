import Store from '../Elements/Store';
import {
   IBackendProfilingData,
   IChangesDescription,
   IControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import Profiler, {
   IFrontendSynchronizationDescription,
   IProfilingData
} from './Profiler';
import { ControlUpdateReason } from './Flamegraph/Flamegraph';

// TODO: почти копипаста из Store
function getDepth(
   elements: Store['_elements'],
   parentId?: IControlNode['parentId']
): number {
   if (parentId) {
      const parent = elements.find((element) => element.id === parentId);
      if (parent) {
         return parent.depth + 1;
      }
   }
   return 0;
}

// TODO: почти копипаста из Store
function addNode(
   elements: Store['_elements'],
   id: IControlNode['id'],
   name: IControlNode['name'],
   parentId?: IControlNode['parentId']
): void {
   if (!parentId) {
      elements.push({
         id,
         name,
         parentId,
         class: '',
         depth: 0
      });
   } else {
      const parentIndex = elements.findIndex(
         (element) => element.id === parentId
      );
      let lastChildIndex = parentIndex + 1;
      if (parentIndex === -1) {
         lastChildIndex = 0;
      } else {
         while (
            elements[lastChildIndex] &&
            elements[lastChildIndex].depth > elements[parentIndex].depth
         ) {
            lastChildIndex++;
         }
      }
      elements.splice(lastChildIndex, 0, {
         id,
         name,
         parentId,
         class: '',
         depth: getDepth(elements, parentId)
      });
   }
}

export function applyOperations(
   initialElements: Store['_elements'],
   operations: Profiler['_currentOperations']
): Store['_elements'] {
   const result = initialElements.slice();

   operations.forEach(([type, id, ...args]) => {
      switch (type) {
         case OperationType.CREATE:
            const parentId = args.length === 3 ? args[2] : undefined;
            addNode(result, id, args[0] as string, parentId);
            break;
         case OperationType.DELETE:
            const index = result.findIndex((element) => element.id === id);
            if (index !== -1) {
               result.splice(index, 1);
            }
            break;
         case OperationType.REORDER:
            break;
         case OperationType.UPDATE:
            break;
      }
   });

   return result;
}

export function convertProfilingData({
   initialIdToDuration,
   syncList
}: IBackendProfilingData): IProfilingData {
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
   profilingData: IProfilingData,
   synchronizationId: string
): Map<IControlNode['id'], IChangesDescription> {
   return (profilingData.synchronizationKeyToDescription.get(
      synchronizationId
   ) as IFrontendSynchronizationDescription).changes;
}

export function getChangesDescription(
   profilingData: IProfilingData,
   synchronizationId: string,
   controlId: string
): IChangesDescription | undefined {
   return getChanges(profilingData, synchronizationId).get(controlId);
}

export function getSelfDuration(
   profilingData: IProfilingData,
   synchronizationId: string,
   controlId: string
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
      id: string;
      selfDuration: number;
      updateReason: ControlUpdateReason;
      parentId?: string;
   }>,
   startId: IControlNode['id'],
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
   const parents: Set<string> = new Set();
   parents.add(startId);

   for (let i = startIndex + 1; i < dataWithSelfDurations.length; i++) {
      const {
         id,
         parentId,
         updateReason,
         selfDuration
      }: {
         id: string;
         selfDuration: number;
         updateReason: ControlUpdateReason;
         parentId?: string;
      } = dataWithSelfDurations[i];
      if (parentId && parents.has(parentId)) {
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

export function getBackgroundColorBasedOnTiming(
   value: number
): Exclude<BACKGROUND_COLOR, '#e2e2e2'> {
   const index =
      Math.max(0, Math.min(colors.length - 1, value)) * (colors.length - 1);
   return colors[Math.round(index)];
}

export function getBackgroundColorBasedOnReason(
   updateReason: ControlUpdateReason
): '#e2e2e2' | '#ffab66' | '#e6d174' | '#b3e6e6' {
   switch (updateReason) {
      case 'mounted':
         return '#ffab66';
      case 'selfUpdated':
         return '#e6d174';
      case 'parentUpdated':
         return '#b3e6e6';
      case 'unchanged':
         return '#e2e2e2';
   }
}

export function formatTime(value: number): string {
   const SECOND = 1000;
   const PRECISION = 2;
   const roundedValue = value.toFixed(PRECISION);
   return value >= SECOND ? `${roundedValue}s` : `${roundedValue}ms`;
}
