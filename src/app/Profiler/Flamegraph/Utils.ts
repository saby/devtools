// TODO: это тоже можно использовать в остальных графиках, но пока непонятно как доставать maxRange
export function getWidth(
   value: number,
   maxValue: number,
   maxRange: number
): number {
   return (value / maxValue) * maxRange;
}
