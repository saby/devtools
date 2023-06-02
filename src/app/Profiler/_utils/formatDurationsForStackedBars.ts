import { IStackedBar } from '../_StackedBar/StackedBar';
import { getBackgroundColorBasedOnTiming } from './Utils';

export type DurationName =
   | 'selfDuration'
   | 'lifecycleDuration'
   | 'renderDuration';

const LENGTH_SCALE = 100;

export function formatDurationsForStackedBars(
   initialData: Array<{
      selfDuration: number;
      lifecycleDuration?: number;
      renderDuration?: number;
   }>,
   durations: DurationName[],
   colorGetter: 'timing' | 'durationName'
): Array<{ bars: IStackedBar[] }> {
   const maxDuration = initialData.reduce(
      (max, { selfDuration }) => Math.max(max, selfDuration),
      0
   );
   return initialData.map((item) => {
      const bars: IStackedBar[] = durations.map((durationName) => {
         const duration = item[durationName] as number;
         return {
            name: durationName,
            value: duration,
            length: (duration / maxDuration) * LENGTH_SCALE,
            color:
               colorGetter === 'durationName'
                  ? `devtools-Profiler__duration_${durationName}`
                  : `devtools-Profiler__duration_${getBackgroundColorBasedOnTiming(
                       duration / maxDuration
                    )}`
         };
      });
      return {
         ...item,
         bars
      };
   });
}
