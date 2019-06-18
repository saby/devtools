import { DataSet, Query } from "Types/source";
import { RecordSet } from "Types/collection";
import { applyWhere } from "../list/applyWhere";
import { orderBy } from "../list/orderBy";
import { applyPaging } from "./query/applyPaging";
import { IFilterData, ListItem } from "../../types";
import { getSize } from "../util/getSize";
import { queue } from "Extension/Utils/queue";
import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";
import { RPCSource } from "./RPC";
import { getParentId, getPath } from "../util/id";
import { findModule } from "../util/findModule";

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
    path?: RecordSet
}

export abstract class QuerySource<
    TTreeData extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
>  extends RPCSource {
    query(query: Query): Promise<DataSet> {
        // @ts-ignore
        let where = <TFilter> query.getWhere();
        // if (Array.isArray(parent)) {
        //     return queue(parent.map((_parent) => {
        //         return this.qu
        //     }));
        // }
        
        let filter = this.__getFilter(query);
        let allModules: ModulesMap;
        return this._getModules().then((map: ModulesMap) => {
            allModules = map;
            return filter(this._query(map, where));
        }).
        then(({ data, hasMore }) => {
            return queue(this.__mapData(data)).then((newData: TTreeData[]) => {
                return {
                    data: newData,
                    hasMore
                }
            });
        }).
        then(({ data, hasMore }: IDataSetConfig) => {
            if (!where.parent) {
                return { data, hasMore };
            }
            const path = getPath(where.parent);
            let pathData = path.map<{ module: Module; itemId: string } | undefined>(({ id, itemId }) => {
                let module = findModule(allModules, id);
                if (!module) {
                    return ;
                }
                return { module, itemId };
            }).filter<{ module: Module; itemId: string }>((module: { module: Module; itemId: string } | undefined) => {
                return !!module;
            }).map<TTreeData[]>(({ module, itemId }: { module: Module; itemId: string }) => {
                const { name } = module;
                return {
                    name,
                    parent: getParentId(itemId),
                    id: itemId,
                }
            });
            let ds = new RecordSet({ rawData: pathData });
            
            return { data, hasMore, path: ds };
        }).
        then(({ data, hasMore, path }: IDataSetConfig) => {
            return new DataSet({
                rawData: {
                    data,
                    meta: { more: hasMore, path }
                },
                itemsProperty: 'data',
                metaProperty: 'meta'
            });
        }).catch((error) => {
            console.log('Abstract => query:catch', this, error);
            return error;
        });
    }
    protected abstract _query(map: ModulesMap, where: TFilter): Promise<TTreeData[]>;

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
