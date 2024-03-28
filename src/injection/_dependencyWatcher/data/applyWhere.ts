import { FilterFunction, FilterFunctionGetter } from './filter/Filter';

function getFilterFunctions<TItem, TFilter extends Record<string, unknown>>(
   where: Partial<TFilter>,
   filterFunctionGetters: Record<
      keyof TFilter,
      FilterFunctionGetter<unknown, TItem>
   >
): Array<FilterFunction<TItem>> {
   const filterFunctions: Array<FilterFunction<TItem>> = [];

   Object.keys(where).forEach((filterName) => {
      const filterGetter = filterFunctionGetters[filterName];
      if (filterGetter) {
         filterFunctions.push(filterGetter(where[filterName]));
      }
   });

   return filterFunctions;
}

function applyWhere<TItem, TFilter extends object>(
   items: TItem[],
   where: Partial<TFilter>,
   filterFunctionGetters: Record<
      keyof TFilter,
      FilterFunctionGetter<unknown, TItem>
   >
): TItem[] {
   const filterFunctions = getFilterFunctions(where, filterFunctionGetters);
   return items.filter((item) => {
      return filterFunctions.every((filter) => {
         return filter(item);
      });
   });
}

export default applyWhere;
