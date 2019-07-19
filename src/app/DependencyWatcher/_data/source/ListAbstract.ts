import { Item } from "../storage/Item";
import { DataSet, Query as TypesQuery } from "Types/source";
import { IItem, IItemFilter, ITransferItem } from "Extension/Plugins/DependencyWatcher/IItem";
import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IListItem } from "../IListItem";
import { createId, getAll, getId } from "./util/id";
import { IDependencies } from "Extension/Plugins/DependencyWatcher/IModule";
import { Compatibility } from './Compatibility';
import { IWhere } from "./list/IWhere";
import { getQueryParam } from "./list/getQueryParam";
import { hasChildren } from "./list/hasChildren";
import { GLOBAL_MODULE_NAME } from "Extension/Plugins/DependencyWatcher/const";
import { queue } from "Extension/Utils/queue";
import { RecordSet } from "Types/collection";
import { IListConfig, DefaultFilters, IgnoreFilters } from "./IList";

let filterGlobal = (item: ITransferItem): boolean => {
    return item.name !== GLOBAL_MODULE_NAME;
};

export abstract class ListAbstract extends Compatibility {
    private __items: Item;
    private __defaultFilters: DefaultFilters;
    private __ignoreFilters: IgnoreFilters;
    constructor(config: IListConfig) {
        super(config);
        this.__items = config.itemStorage;
        this.__defaultFilters = config.defaultFilters || {};
        this.__ignoreFilters = config.ignoreFilters || {};
    }
    
    query(query: TypesQuery): Promise<DataSet> {
        const queryParam = getQueryParam(
            query,
            undefined,
            this.__ignoreFilters,
            this.__defaultFilters
        );
        const { where } = queryParam;
        const parent = where.parent;
        delete  where.parent;
        return this.__callQuery(queryParam, parent).then(({ data, hasMore }) => {
            return this.__createPath(parent).then((path: RecordSet | void) => {
                return new DataSet({
                    rawData: {
                        data,
                        meta: {
                            more: hasMore,
                            path
                        }
                    },
                    itemsProperty: 'data',
                    metaProperty: 'meta'
                });
            });
        }).catch((error: Error) => {
            console.log(error);
            throw error;
        });
    }

    private __callQuery(param: QueryParam<IItem, IItemFilter>, parent?: string | string[]) {
        if (!parent) {
            return this.__query(param);
        }

        if (Array.isArray(parent)) {
            return this.__queryItems(parent, param);
        }

        let ItemId = parent? getId(parent): undefined;
        if (!ItemId) {
            return this.__query(param);
        }

        return this.__queryItem(ItemId, parent, param);
    }

    private __query(param: QueryParam<IItem, IItemFilter>): Promise<QueryResult<IListItem>> {
        let _hasMore: boolean;
        return this.__beforeQuery(param).then(() => {
            return this.__items.query(param);
        }).then(({ data, hasMore }) => {
            _hasMore = hasMore;
            return this.__items.getItems(data);
        }).then((items: ITransferItem[]) => {
            return {
                hasMore: _hasMore,
                data: items.filter(filterGlobal).map(item => this.__createItem(item))
            }
        });
    }

    private __queryItem(
        itemId: number,
        listItemId: string,
        param: QueryParam<IItem, IItemFilter>
    ): Promise<QueryResult<IListItem>> {
        return this.__items.getItems([itemId]).then(([ item ]: ITransferItem[]) => {
            if (!item) {
                throw new Error('Не удалось получить данные узела');
            }
            const children = this._getChildren(item);
            let _hasMore: boolean;
            return this.__items.query({
                ...param,
                keys: [...children.dynamic, ...children. static]
            }).then(({ data, hasMore }) => {
                _hasMore = hasMore;
                return this.__items.getItems(data);
            }).then((items: ITransferItem[]) => {
                return {
                    hasMore: _hasMore,
                    data: items.map((item) => this.__createItem(
                        item,
                        listItemId,
                        children.dynamic.includes(item.id)
                    ))
                }
            });
        });
    }

    private __queryItems(
        parents: (string | undefined)[],
        param: QueryParam<IItem, IWhere>
    ): Promise<QueryResult<IListItem>> {
        const querySteps = parents.map((parent?: string) => {
            return () => {
                return this.__callQuery(param, parent);
            }
        });
        return queue(querySteps).then((results: QueryResult<IListItem>[]) => {
            return results.reduce((current, next) => {
                return {
                    hasMore: current.hasMore || next.hasMore,
                    data: [ ...current.data, ...next.data ]
                }
            });
        });
    }

    private __createItem(
        item: ITransferItem,
        parent?: string,
        isDynamic: boolean = false
    ): IListItem {
        const { name, id, defined, fileName, fileId, path, size } = item;
        return {
            name, defined, fileName, fileId, path, size,
            isDynamic,
            parent,
            id: createId(id, parent),
            child: hasChildren(this._getChildren(item))
        }
    }
    
    private __beforeQuery({ sortBy }: QueryParam<IItem, IItemFilter>): Promise<void> {
        if (
            typeof sortBy.size == 'undefined'
        ) {
            return Promise.resolve();
        }
        return Promise.resolve();
    }
    
    private __createPath(parent?: string | string[]): Promise<RecordSet | void> {
        if (!parent || Array.isArray(parent)) {
            return Promise.resolve();
        }
        const keys: number[] = getAll(parent).reverse();
        const parents: Record<number, string> = {};
        for (let i = 0; i < keys.length; i++) {
            parents[keys[i]] = createId(keys[i], parents[keys[i -1]])
        }
        return this.__items.getItems(keys).then((items: ITransferItem[]) => {
            const listItems: IListItem[] = [];
            for (let i = 0; i < items.length; i++) {
                const parent = listItems[i-1];
                const item = this.__createItem(items[i], parent && parent.id);
                listItems.push(item);
            }
            return  listItems;
        }).then((items: IListItem[]) => {
            return new RecordSet({ rawData: items })
        });
    }
    
    protected abstract _getChildren(item: ITransferItem): IDependencies<number[]>;
}
