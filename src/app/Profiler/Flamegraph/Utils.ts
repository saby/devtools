// TODO: список функций, которые актуальны и для Flamegraph, и для Ranked View
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

// TODO: это можно считать для обоих графиков, но тогда нужно isSelected в другом месте
export function getBackgroundColor(
   value: number,
   didRender: boolean
): BACKGROUND_COLOR {
   let result: BACKGROUND_COLOR = '#e2e2e2';

   if (didRender) {
      const index =
         Math.max(0, Math.min(colors.length - 1, value)) * (colors.length - 1);
      result = colors[Math.round(index)];
   }

   return result;
}

export function getWidth(
   value: number,
   maxValue: number,
   maxRange: number
): number {
   return (value / maxValue) * maxRange;
}
