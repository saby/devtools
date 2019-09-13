import { SortFunction, SortResult } from './sort/Sort';
import { SortBy } from './IQuery';

function isEmpty<T extends object>(obj: T): boolean {
   return !Object.keys(obj).length;
}

function wrapWithOrder<T>(
   sort: SortFunction<T>,
   order: boolean
): SortFunction<T> {
   const k = order ? 1 : -1;
   return (first: T, second: T): SortResult => {
      return sort(first, second) * k;
   };
}

function getSortFunctions<TItem extends object>(
   sortBy: SortBy<TItem>,
   sortFunctions: Record<string, SortFunction<TItem>>
): Array<SortFunction<TItem>> {
   const result: Array<SortFunction<TItem>> = [];
   for (const sortField in sortBy) {
      if (
         sortBy.hasOwnProperty(sortField) &&
         sortFunctions.hasOwnProperty(sortField)
      ) {
         result.push(
            wrapWithOrder(sortFunctions[sortField], sortBy[
               sortField
            ] as boolean)
         );
      }
   }
   return result;
}

function applySort<TItem extends object>(
   items: TItem[],
   sortBy: SortBy<TItem>,
   allSortFunctions: Record<string, SortFunction<TItem>>
): TItem[] {
   if (isEmpty(sortBy)) {
      return items;
   }
   const sortFunctions = getSortFunctions(sortBy, allSortFunctions);
   if (!sortFunctions.length) {
      return items;
   }
   return items.sort((first: TItem, second: TItem) => {
      for (const sortFunction of sortFunctions) {
         const priority = sortFunction(first, second);
         if (priority) {
            return priority;
         }
      }
      return SortResult.equal;
   });
}

export default applySort;
