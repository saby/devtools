// @ts-ignore
import { DataSet, ICrud, Query } from 'Types/source';
import { IFilterData, ListItem } from "../../interface/View";
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
import { applyWhere } from "./applyWhere";
import { applyOrderBy } from "./applyOrderBy";
import { applyPaging } from "./applyPaging";
import { IQuery } from "./IQuery";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";

export interface ISourceConfig {
    rpc: RPC
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
    TTreeData extends ListItem,
    TFilter extends IFilterData = IFilterData
> implements ICrud {
    protected _rpc: RPC;
    private __lastQueryResult: DependenciesRecord;
    private __lastBundles: Bundles;
    constructor({ rpc }: ISourceConfig) {
        this._rpc = rpc;
    }
    query(query: Query): Promise<DataSet> {
        let where: TFilter = query.getWhere();
        
        return Promise.all([
            this.__getModules(),
            this.__getBundles()
        ]).
        then(([data, bundles]) => {
            return this._query({
                data,
                where,
                bundles
            });
        }).
        then(applyWhere<TTreeData, TFilter>(where, query.getLimit())).
        then(applyOrderBy<TTreeData>(query.getOrderBy())).
        then(applyPaging<TTreeData>(query.getOffset(), query.getLimit())).
        then((rawData: TTreeData[]) => {
            return new DataSet({
                rawData
            })
        }).catch((error) => {
            console.log('Abstract => query:catch', this, error);
            return error;
        });
    }
    protected abstract _query(query: IQuery<TFilter>): Promise<TTreeData[]> | TTreeData[];

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
    private __getModules(): Promise<IModulesDependencyMap> {
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
    private __getBundles(): Promise<Bundles> {
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
    create(): Promise<any> {
        console.log('create', arguments);
        return Promise.reject(new Error('noup'))
    }
    read(): Promise<any>{
        console.log('read', arguments);
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
    private __opt: unknown;
    setOptions(opt: unknown) {
        this.__opt = opt;
    }
    getOptions() {
        return this.__opt || {};
    }
    /// endregion compatibility
}
