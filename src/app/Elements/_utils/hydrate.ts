import { getValueByPath } from 'Extension/Utils/getValueByPath';
import { DehydratedItem } from 'Types/ElementInspection';

export const INSPECTED_ITEM_META = {
   expandable: Symbol('expandable'),
   caption: Symbol('caption'),
   type: Symbol('type')
};

/**
 * This function is used to convert dehydrated data to a format that is understandable by the frontend.
 * @author Зайцев А.С.
 */
export function hydrate(
   data: Record<string | number, unknown>,
   cleaned: Array<Array<string | number>>
): object | undefined {
   // roots require special handling
   if (cleaned.length === 1 && cleaned[0].length === 1) {
      const value = data as DehydratedItem;
      if (value.type === 'object' && value.expandable) {
         return {};
      } else {
         return;
      }
   }

   cleaned.forEach((path) => {
      // first part of the path is the root, so we have to remove it
      const actualPath = path.slice(1);
      const last = actualPath[actualPath.length - 1];
      const parent = getValueByPath(data, actualPath.slice(0, -1)) as object;

      if (!parent || !parent.hasOwnProperty(last)) {
         return;
      }

      const value = parent[last] as DehydratedItem;

      switch (value.type) {
         case 'undefined':
            parent[last] = {
               [INSPECTED_ITEM_META.type]: 'undefined'
            };
            break;
         default:
            const replaced: Record<symbol, boolean | string> = {
               [INSPECTED_ITEM_META.caption]: value.caption,
               [INSPECTED_ITEM_META.type]: value.type
            };
            if (value.type === 'object' || value.type === 'array') {
               replaced[INSPECTED_ITEM_META.expandable] = value.expandable;
            }
            parent[last] = replaced;
      }
   });

   return data;
}
