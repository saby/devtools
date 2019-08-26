import applyWhere from 'Extension/Plugins/DependencyWatcher/data/applyWhere';
import applySort from 'Extension/Plugins/DependencyWatcher/data/applySort';
import { applyPaging } from 'Extension/Plugins/DependencyWatcher/data/applyPaging';
import { IQuery, QueryParam, QueryResult } from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

export abstract class Query<TItem extends IId, TFilter extends object> implements IQuery<TItem, TFilter> {
    query({
        keys,
        where = {},
        offset = 0,
        limit,
        sortBy = {}
    }: Partial<QueryParam<TItem, TFilter>>): QueryResult<number> {
        let items = this._getItems(keys);
        const filteredItems = applyWhere(items, where, this._getFilters());
        const sortedItems =  <TItem[]> applySort(filteredItems, sortBy, this._getSorting());
        const resultKeys: number[] = sortedItems.map(({ id }: TItem) => id);
        return applyPaging<number>(resultKeys, offset, limit);
    };
    protected abstract  _getItems(keys?: number[]): TItem[];
    protected abstract _getFilters(): Partial<Record<keyof TFilter, FilterFunctionGetter<any, TItem>>>
    protected abstract _getSorting(): Record<keyof TItem, SortFunction<TItem>>
}
