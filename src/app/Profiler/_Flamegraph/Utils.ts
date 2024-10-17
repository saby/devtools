/**
 * Calculates the width of a commit in the flamegraph. Basically, calculates what portion of the max value current commit takes.
 * @param value Duration of the commit.
 * @param maxValue Duration of the longest commit.
 * @param maxRange Width of the container.
 * @return The width of the commit.
 * @author Зайцев А.С.
 */
export function getWidth(
   value: number,
   maxValue: number,
   maxRange: number
): number {
   return (value / maxValue) * maxRange;
}
