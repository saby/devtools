export function getWidth(
   value: number,
   maxValue: number,
   maxRange: number
): number {
   return (value / maxValue) * maxRange;
}
