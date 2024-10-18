/**
 * Returns nested value from the object.
 * @author Зайцев А.С.
 */
export function getValueByPath(
   data: object | null,
   path: Array<string | number>
): unknown {
   return path.reduce((reduced: object | null, attr) => {
      if (reduced) {
         if (reduced.hasOwnProperty(attr)) {
            return reduced[attr];
         }
      }

      return null;
   }, data);
}
