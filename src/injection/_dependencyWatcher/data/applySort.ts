import { SortFunction, SortResult } from './sort/Sort';
import { SortBy } from 'Extension/Plugins/DependencyWatcher/data/IQuery';

function wrapWithOrder<T>(
   sort: SortFunction<T>,
   order: boolean
): SortFunction<T> {
   const k = order ? 1 : -1;
   return (first: T, second: T): SortResult => {
      return sort(first, second) * k;
   };
}

function applySort<TItem extends object>(
   items: TItem[],
   sortBy: SortBy<TItem>,
   allSortFunctions: Record<string, SortFunction<TItem>>
): TItem[] {
   const sortByEntries = Object.entries(sortBy);
   if (!sortByEntries.length) {
      return items;
   }
   return items
      .slice()
      .sort(
         wrapWithOrder(
            allSortFunctions[sortByEntries[0][0]],
            sortByEntries[0][1]
         )
      );
}

export default applySort;
