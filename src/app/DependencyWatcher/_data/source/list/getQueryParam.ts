import { Query as TypesQuery } from "Types/source";
import { QueryParam, SortBy } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IWhere, IWhereKey } from "./IWhere";

export type IgnoreFilters<TData extends object> = Partial<Record<IWhereKey<TData>, IWhereKey<TData>[]>>;

export type DefaultFilters<TData extends object> = Partial<TData>;

export const getQueryParam = <TData extends object>(
    query: TypesQuery,
    keys?: number[],
    ignoreFilters: IgnoreFilters<TData> = {},
    defaultFilters: DefaultFilters<TData> = {}
): QueryParam<TData, IWhere<TData>> => {
    const sortBy: SortBy<TData> = {};
    query.getOrderBy().forEach((order) => {
        sortBy[<keyof TData> order.getSelector()] = !!order.getOrder();
    });
    const queryWhere = <IWhere<TData> & { id?: number | number[]}> query.getWhere();
    if (queryWhere.id) {
        keys = Array.isArray(queryWhere.id)? queryWhere.id: [queryWhere.id];
        delete queryWhere.id;
    }
    const where = <IWhere<TData>> {
        ...defaultFilters,
        ...queryWhere
    };
    for (let filterKey in ignoreFilters) {
        if (!where.hasOwnProperty(filterKey) ||
            where[ <IWhereKey<TData>> filterKey] === null ||
            where[ <IWhereKey<TData>> filterKey] === undefined
        ) {
            continue;
        }
        let ignore = ignoreFilters[<IWhereKey<TData>> filterKey];
        if (!ignore) {
            continue;
        }
        ignore.forEach((ignore: IWhereKey<TData>) => {
            delete where[ignore];
        });
    }
    return {
        keys, where, sortBy,
        limit: query.getLimit(),
        offset: query.getOffset()
    }
};
