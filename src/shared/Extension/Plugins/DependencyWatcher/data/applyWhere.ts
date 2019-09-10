import { FilterFunction, FilterFunctionGetter } from './filter/Filter';

function getFilterFunctions<TItem, TFilter extends object>(
   where: Partial<TFilter>,
   filterFunctionGetters: Partial<
      Record<keyof TFilter, FilterFunctionGetter<any, TItem>>
   >
): Array<FilterFunction<TItem>> {
   const filterFunctions: Array<FilterFunction<TItem>> = [];
   for (const filterName in where) {
      const filterGetter = filterFunctionGetters[filterName];
      if (!filterGetter) {
         continue;
      }
      filterFunctions.push(filterGetter(where[filterName]));
   }
   return filterFunctions;
}

function applyWhere<TItem, TFilter extends object>(
   items: TItem[],
   where: Partial<TFilter>,
   filterFunctionGetters: Partial<
      Record<keyof TFilter, FilterFunctionGetter<any, TItem>>
   >
): TItem[] {
   const filterFunctions: Array<FilterFunction<TItem>> = getFilterFunctions(
      where,
      filterFunctionGetters
   );
   return items.filter((item: TItem) => {
      return filterFunctions.every((filter: FilterFunction<TItem>) => {
         return filter(item);
      });
   });
}

export default applyWhere;
