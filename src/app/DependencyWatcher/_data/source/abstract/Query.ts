import { DataSet, Query } from "Types/source";
import { RecordSet } from "Types/collection";
import { applyWhere } from "../list/applyWhere";
import { orderBy } from "../list/orderBy";
import { applyPaging } from "./query/applyPaging";
import { IFilterData, ListItem } from "../../types";
import { getSizes } from "../util/getSizes";
import { queue } from "Extension/Utils/queue";
import { Module, ModulesMap } from "Extension/Plugins/DependencyWatcher/IModule";
import { RPCSource } from "./RPC";
import { getMinPath, getParentId, getPath } from "../util/id";
import { findModule } from "../util/findModule";
import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";

export interface IQueryConfig {

}

interface IDataSetConfig <TTreeData extends ListItem = ListItem> {
    data: TTreeData[],
    hasMore: boolean;
    path?: RecordSet
}

interface BreadCrumbsItem {
    module: Module;
    itemId: string;
}

const getPathCreator = <TTreeData extends ListItem, TFilter extends IFilterData>(
    parent: string | undefined,
    map: ModulesMap
): ((data: IDataSetConfig<TTreeData>) => IDataSetConfig<TTreeData>) => {
    return ({ data, hasMore }: IDataSetConfig<TTreeData>) => {
        if (!parent) {
            return { data, hasMore };
        }
        const path = getPath(parent);
        let pathData = path.map<BreadCrumbsItem | undefined>(({ id, itemId }) => {
            let module = findModule(map, id);
            if (!module) {
                return ;
            }
            return { module, itemId };
        }).filter<BreadCrumbsItem>(
            // @ts-ignore
            module => { return !!module; }
        ).map<TTreeData[]>(({ module, itemId }: BreadCrumbsItem) => {
            const { name } = module;
            return {
                name,
                parent: getParentId(itemId),
                id: itemId,
            }
        });
        let ds = new RecordSet({ rawData: pathData });
        
        return { data, hasMore, path: ds };
    }
};


export abstract class QuerySource<
    TTreeData extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
>  extends RPCSource {
    private __sizes: Record<string, number> = {};
    private __notFoundSizes: Record<string, true> = {};
    query(query: Query): Promise<DataSet> {
        // if (Array.isArray(parent)) {
        //     return queue(parent.map((_parent) => {
        //         return this.qu
        //     }));
        // }
        return this.__getItems(query).
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
    private __getItems(query: Query): Promise<IDataSetConfig<TTreeData>> {
        // @ts-ignore
        let where = <TFilter> query.getWhere();
        let filter = this.__getFilter(query);
        let allModules: ModulesMap;
        return this._getModules().then((map: ModulesMap) => {
            allModules = map;
            if (!Array.isArray(where.parent)) {
                return filter(this._query(map, where)).then(getPathCreator(where.parent, map));
            }
            return filter(queue(where.parent.map((parent) => {
                const _where = {
                    ...where,
                    parent
                };
                return () => {
                    return this._query(map, _where);
                }
            })).then<TTreeData[]>((data: TTreeData[][]) => {
                // @ts-ignore
                return data.flat();
            })).then(getPathCreator(where.parent.reduce(getMinPath), map));
        })
    }
    private __setFileData(data: TTreeData[]): TTreeData[] | Promise<TTreeData[]> {
        const neededFiles: number[] = data.filter((item) => {
            return !item.fileName && item.fileId;
        }).map((item) => {
            return <number> item.fileId;
        });
        if (!neededFiles.length) {
            return data;
        }
        return this._getFiles(neededFiles).then((files: Map<number, IFile>) => {
            const _data: TTreeData[] = data.map((item) => {
                if (item.fileName || !item.fileId) {
                    return item;
                }
                let file = <IFile> files.get(item.fileId);
                return {
                    ...item,
                    size: file.size,
                    fileName: file.name
                }
            });
            return _data;
        });
    }
    private __setSize(data: TTreeData[]): Promise<TTreeData[]> {
        const needReadSizes = !data.every((item: TTreeData) => {
            return !!(item.size || (!item.fileName && item.size))
        });
        if (!needReadSizes) {
            return Promise.resolve(data);
        }
        return getSizes().then((sizes: Record<string, number>) => {
            data.forEach((item: TTreeData) => {
                if (!item.fileName) {
                    return;
                }
                for (const url in sizes) {
                    if (url.includes(item.fileName)) {
                        item.size = sizes[url];
                        this._setSize(item.fileName, sizes[url]);
                        delete sizes[url];
                        return;
                    }
                }
            });
            return data;
        });
    }
    protected abstract _query(map: ModulesMap, where: TFilter): Promise<TTreeData[]>;

    private __getFilter(query: Query): ((queryPromise: Promise<TTreeData[]>) => Promise<IDataSetConfig<TTreeData>>) {
        let countAfterFilter: number;
        return (queryPromise: Promise<TTreeData[]>) => {
            return queryPromise.
            // @ts-ignore
            then(applyWhere<TTreeData, TFilter>(query.getWhere(), query.getLimit())).
            then((set: TTreeData[]) => {
                countAfterFilter = set.length;
                return set;
            }).
            then(this.__setFileData.bind(this)).
            then(this.__setSize.bind(this)).
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
}
