import { DataSet, Query } from "Types/source";
import { applyWhere } from "./query/applyWhere";
import { orderBy } from "../list/orderBy";
import { applyPaging } from "./query/applyPaging";
import { IFilterData, ListItem } from "../../types";
import { getSize } from "../util/getSize";
import { queue } from "Extension/Utils/queue";

export interface IQueryConfig {

}
let getName = (module: string): string => {
    let [ ext, name ] = module.split('!');
    if (!name) {
        name = ext;
        ext = 'js';
    }
    ext = '.' + ext;
    if (name.endsWith(ext)) {
        return name;
    }
    return name + ext;
};

interface IDataSetConfig <TTreeData extends ListItem = ListItem> {
    data: TTreeData[],
    hasMore: boolean;
}

export abstract class QuerySource<
    TTreeData extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
> {
    constructor(config: IQueryConfig) {
    
    }
    query(query: Query): Promise<DataSet> {
        // @ts-ignore
        let where = <TFilter> query.getWhere();
        // if (Array.isArray(parent)) {
        //     return queue(parent.map((_parent) => {
        //         return this.qu
        //     }));
        // }
        
        let filter = this.__getFilter(query);
        return filter(this._query(where)).then(({ data, hasMore }) => {
            return queue(this.__mapData(data)).then((newData: TTreeData[]) => {
                return {
                    data: newData,
                    hasMore
                }
            });
        }).then(({ data, hasMore }: IDataSetConfig) => {
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
    protected abstract _query(where: TFilter): Promise<TTreeData[]>;

    private __getFilter(query: Query) {
        let countAfterFilter: number;
        return (queryPromise: Promise<TTreeData[]>) => {
            return queryPromise.
            // @ts-ignore
            then(applyWhere<TTreeData, TFilter>(query.getWhere(), query.getLimit())).
            then((set: TTreeData[]) => {
                countAfterFilter = set.length;
                return set;
            }).
            then(orderBy<TTreeData>(query.getOrderBy())).
            then(applyPaging<TTreeData>(query.getOffset(), query.getLimit())).
            then((data: TTreeData[]) => {
                return {
                    data,
                    hasMore: countAfterFilter > query.getOffset() + data.length
                }
            });
        }
    }

    private readonly __sizes: Record<string, number> = Object.create(null);
    private __getSize(module: TTreeData): Promise<number | void> {
        if (this.__sizes[module.name]) {
            return Promise.resolve(this.__sizes[module.name]);
        }
        return getSize(
            module.fileName ||
            module.bundle ||
            getName(module.name)
        ).then((size?: number) => {
            if (size) {
                this.__sizes[module.name] = size;
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
                return this.__getSize(item).then((size: number | void) => {
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
