import { Query as TypesQuery } from 'Types/source';
import {
   IQueryParam,
   SortBy
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { IWhere, IWhereKey } from './IWhere';

export type IgnoreFilters<TData extends object> = Partial<
   Record<IWhereKey<TData>, Array<IWhereKey<TData>>>
>;

export type DefaultFilters<TData extends object> = Partial<TData>;

/**
 * Normalizes query params.
 * @author Зайцев А.С.
 */
export function getQueryParam<TData extends object>(
   query: TypesQuery,
   ignoreFilters: IgnoreFilters<TData> = {},
   defaultFilters: DefaultFilters<TData> = {}
): IQueryParam<TData, IWhere<TData>> {
   const sortBy: SortBy<TData> = {};
   query.getOrderBy().forEach((order) => {
      sortBy[order.getSelector() as keyof TData] = !!order.getOrder();
   });
   const queryWhere = query.getWhere() as IWhere<TData> & {
      id?: number | number[];
   };
   let keys;
   if (queryWhere.id) {
      keys = Array.isArray(queryWhere.id) ? queryWhere.id : [queryWhere.id];
      delete queryWhere.id;
   }
   const where = {
      ...defaultFilters,
      ...queryWhere
   } as IWhere<TData>;
   for (const filterKey in ignoreFilters) {
      if (
         !where.hasOwnProperty(filterKey) ||
         where[filterKey as IWhereKey<TData>] === null ||
         where[filterKey as IWhereKey<TData>] === undefined
      ) {
         continue;
      }
      const currentIgnore = ignoreFilters[filterKey as IWhereKey<TData>];
      if (!currentIgnore) {
         continue;
      }
      currentIgnore.forEach((ignore: IWhereKey<TData>) => {
         delete where[ignore];
      });
   }
   return {
      keys,
      where,
      sortBy,
      limit: query.getLimit(),
      offset: query.getOffset()
   };
}
