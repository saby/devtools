import { DataSet, Query } from "Types/source";
import { applyWhere } from "./query/applyWhere";
import { orderBy } from "../list/orderBy";
import { applyPaging } from "./query/applyPaging";
import { IFilterData, ListItem } from "../../types";
import { SortFunction } from "../list/Sort";
import { sortFunctions } from "../list/sortFunctions";
import { getSize } from "../util/getSize";
import { queue } from "Extension/Utils/queue";

export interface IQueryConfig {

}

export abstract class QuerySource<
    TTreeData extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
> {
    protected _sortFunctions: SortFunction<TTreeData>[] = sortFunctions;
    constructor(config: IQueryConfig) {
    
    }
    query(query: Query): Promise<DataSet> {
        let filter = this.__getFilter(query);
        return filter(this._query(query)).then(({ data, hasMore}) => {
            return queue(this.__mapData(data)).then((newData: TTreeData[]) => {
                return {
                    data: newData,
                    hasMore
                }
            });
        }).then(({ data, hasMore }) => {
            return new DataSet({
                rawData: {
                    data,
                    meta: { more: hasMore }
                },
                itemsProperty: 'data',
                metaProperty: 'meta'
            });
        }).catch((error) => {
            console.log('Abstract => query:catch', this, error);
            return error;
        });
    }
    protected abstract _query(query: Query): Promise<TTreeData[]>;

    private __getFilter(query: Query) {
        let countAfterFilter: number;
        return (queryPromise: Promise<TTreeData[]>) => {
            return queryPromise.
            // @ts-ignore
            then(applyWhere<TTreeData, TFilter>(query.getWhere(), query.getLimit())).
            then((set) => {
                countAfterFilter = set.length;
                return set;
            }).
            then(orderBy<TTreeData>(query.getOrderBy(), this._sortFunctions)).
            then(applyPaging<TTreeData>(query.getOffset(), query.getLimit())).
            then((data) => {
                return {
                    data,
                    hasMore: countAfterFilter > query.getOffset() + data.length
                }
            });
        }
    }

    private readonly __sizes: Record<string, number> = Object.create(null);
    private __getSize(module: string): Promise<number | void> {
        if (this.__sizes[module]) {
            return Promise.resolve(this.__sizes[module]);
        }
        return getSize(module).then((size?: number) => {
            if (size) {
                this.__sizes[module] = size;
            }
            return size;
        })
    }
    private __mapData(data: TTreeData[]): (() => Promise<TTreeData>)[] {
        return data.map((item) => {
            return () => {
                if (item.size) {
                    return  Promise.resolve(item);
                }
                return this.__getSize(item.name).then((size: number | void) => {
                    if (!size) {
                        return item;
                    }
                    //@ts-ignore
                    this._setSize(item.name, size);
                    return {
                        ...item,
                        size
                    }
                });
            }
        });
    }
}
