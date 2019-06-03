import { DependencyType, RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { Dependencies, DependenciesRecord, IModulesDependencyMap } from "Extension/Plugins/DependencyWatcher/Module";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { RPC } from "Extension/Event/RPC";

export interface IRPCSourceConfig {
    rpc: RPC;
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

export class RPCSource {
    protected _rpc: RPC;
    private __lastQueryResult: DependenciesRecord;
    private __lastBundles: Bundles;
    constructor({ rpc }: IRPCSourceConfig) {
        this._rpc = rpc;
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
}
