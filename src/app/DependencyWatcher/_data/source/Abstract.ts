// @ts-ignore
import { DataSet, ICrud, Query } from 'Types/source';
// @ts-ignore
import { adapter, Model } from 'Types/entity';
import {
    IFilterData,
    ListItem
} from "../types";

import {
    DependencyType,
    RPCMethods,
} from 'Extension/Plugins/DependencyWatcher/const';
import { RPC } from "Extension/Event/RPC";
import {
    Dependencies,
    DependenciesRecord,
    IModulesDependencyMap
} from "Extension/Plugins/DependencyWatcher/Module";
import { applyWhere } from "./util/applyWhere";
import { orderBy } from "./list/orderBy";
import { applyPaging } from "./util/applyPaging";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { deserialize } from "./util/id";
import { SortFunction } from "./list/Sort";
import { sortFunctions } from "./list/sortFunctions";

export interface ISourceConfig {
    rpc: RPC;
    idProperty: string;
}

let convertData = (data: DependenciesRecord): IModulesDependencyMap => {
    let map = new Map();
    for (let type in data) {
        let dependencies: Dependencies = data[<DependencyType> type];
        for (let moduleName in dependencies) {
            let module = map.get(moduleName);
            if (!module) {
                module = {
                    [DependencyType.static]: [],
                    [DependencyType.dynamic]: []
                }
            }
            module[type] = dependencies[moduleName] || [];
            map.set(moduleName, module);
        }
    }
    return map;
};

export abstract class Abstract<
    TTreeData extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
> implements ICrud {
    protected _rpc: RPC;
    protected _sortFunctions: SortFunction<TTreeData>[] = sortFunctions;
    private __lastQueryResult: DependenciesRecord;
    private __lastBundles: Bundles;
    constructor({ rpc, idProperty }: ISourceConfig) {
        this._rpc = rpc;
        this._idProperty = idProperty;
    }
    query(query: Query): Promise<DataSet> {
        let countAfterFilter: number;
        return this._query(query).
            then(applyWhere<TTreeData, TFilter>(query.getWhere(), query.getLimit())).
            then((set) => {
                countAfterFilter = set.length;
                return set;
            }).
            then(orderBy<TTreeData>(query.getOrderBy(), this._sortFunctions)).
            then(applyPaging<TTreeData>(query.getOffset(), query.getLimit())).
            then((data: TTreeData[]) => {
                
                return new DataSet({
                    rawData: {
                        data,
                        meta: { more: countAfterFilter > query.getOffset() + data.length }
                    },
                    itemsProperty: 'data',
                    metaProperty: 'meta'
                });
            }).catch((error) => {
                console.log('Abstract => query:catch', this, error);
                return error;
            });
    }
    protected abstract _query(query: Query<TFilter>): Promise<TTreeData[]>;

    read<TKey extends string, TMeta = unknown>(id: TKey, meta?: TMeta): Promise<Model<TTreeData>> {
        // return Promise.resolve(module);
        try {
            return Promise.resolve(this._read(id, meta));
        }
        catch (e) {
            console.log(e);
            let [ name ] = deserialize(id);
            return Promise.resolve(new Model({
                rawData: {
                    name,
                    child: false,
                    id
                }
            }));
        }
        
    }
    protected abstract _read<TKey extends string, TMeta = unknown>(id: TKey, meta?: TMeta): Promise<TTreeData> | TTreeData;
    
    create(): Promise<any> {
        console.log('create', arguments);
        return Promise.reject(new Error('noup'))
    }
    
    update(): Promise<any>{
        console.log('update', arguments);
        return Promise.reject(new Error('noup'))
    }
    delete(): Promise<any>{
        console.log('delete', arguments);
        return Promise.reject(new Error('noup'))
    }
    
    private __checkNewModules(): Promise<boolean> {
        let data = this.__lastQueryResult;
        if (!data) {
            return  Promise.resolve(true);
        }
        let staticCount = data.static? Object.keys(data.static).length: 0;
        let dynamicCount = data.dynamic? Object.keys(data.dynamic).length: 0;
        return this._rpc.execute({
            methodName: RPCMethods.hasNewModules,
            args: {
                count: staticCount + dynamicCount
            }
        })
    }
    private __cacheQueryResult(data: DependenciesRecord) {
        this.__lastQueryResult = data;
        return data;
    }
    protected _getModules(): Promise<IModulesDependencyMap> {
        return this.__checkNewModules().then((hasNewModules: boolean) => {
            if (!hasNewModules) {
                return convertData(this.__lastQueryResult);
            }
            return this._rpc.execute<DependenciesRecord>({
                methodName: RPCMethods.getModules
            }).then(this.__cacheQueryResult.bind(this)).
                then(convertData);
        });
    }
    protected _getBundles(): Promise<Bundles> {
        if (this.__lastBundles) {
            return Promise.resolve(this.__lastBundles);
        }
        return this._rpc.execute<Bundles>({
            methodName: RPCMethods.getBundles
        }).then((bundles) => {
            this.__lastBundles = bundles;
            return  bundles;
        });
    }
    
    /// region compatibility
    readonly '[Types/_source/ICrud]': boolean = true;
    private __opt: unknown;
    setOptions(opt: unknown) {
        this.__opt = opt;
    }
    getOptions() {
        return this.__opt || {};
    }
    private _idProperty: string;
    getIdProperty() {
        return this._idProperty;
    }
    private _adapter = new adapter.Json;
    getAdapter() {
        return this._adapter;
    }
    /// endregion compatibility
}
