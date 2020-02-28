import applyWhere from '../data/applyWhere';
import applySort from '../data/applySort';
import { applyPaging } from '../data/applyPaging';
import {
   IQueryParam,
   IQueryResult
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { FilterFunctionGetter } from '../data/filter/Filter';
import { SortFunction } from '../data/sort/Sort';
import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

/**
 * Base class for data sources.
 * @author Зайцев А.С.
 */
export abstract class Query<TItem extends IId, TFilter extends object> {
   query({
      keys,
      where = {},
      offset = 0,
      limit,
      sortBy = {}
   }: Partial<IQueryParam<TItem, TFilter>>): IQueryResult<number> {
      const items = this._getItems(keys);
      const filteredItems = applyWhere(items, where, this._getFilters());
      const sortedItems = applySort(filteredItems, sortBy, this._getSorting());
      const resultKeys = sortedItems.map(({ id }: TItem) => id);
      return applyPaging(resultKeys, offset, limit);
   }
   protected abstract _getItems(keys?: number[]): TItem[];
   protected abstract _getFilters(): Record<
      keyof TFilter,
      FilterFunctionGetter<unknown, TItem>
   >;
   protected abstract _getSorting(): Record<keyof TItem, SortFunction<TItem>>;
}
