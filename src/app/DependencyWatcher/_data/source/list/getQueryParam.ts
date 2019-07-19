import { Query as TypesQuery } from "Types/source";
import { QueryParam, SortBy } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IItem, IItemFilter, IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";
import { IWhere, IWhereKey } from "./IWhere";
import { DefaultFilters, IgnoreFilters } from "../IList";

export const getQueryParam = (
    query: TypesQuery,
    keys?: number[],
    ignoreFilters: IgnoreFilters = {},
    defaultFilters: DefaultFilters = {}
): QueryParam<IItem, IWhere> => {
    const sortBy: SortBy<IItemInfo> = {};
    query.getOrderBy().forEach((order) => {
        sortBy[<keyof IItemInfo> order.getSelector()] = !!order.getOrder();
    });
    const where = <IWhere> {
        ...defaultFilters,
        ...query.getWhere()
    };
    for (let filterKey in ignoreFilters) {
        if (!where.hasOwnProperty(filterKey) ||
            where[ <IWhereKey> filterKey] === null ||
            where[ <IWhereKey> filterKey] === undefined
        ) {
            continue;
        }
        let ignore = ignoreFilters[<IWhereKey> filterKey];
        if (!ignore) {
            continue;
        }
        ignore.forEach((ignore: IWhereKey) => {
            delete where[ignore];
        });
    }
    return {
        keys, where, sortBy,
        limit: query.getLimit(),
        offset: query.getOffset()
    }
};
