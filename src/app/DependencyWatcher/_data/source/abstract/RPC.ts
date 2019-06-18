import { RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { ModulesMap, ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { RPC } from "Extension/Event/RPC";
import { convertToMap } from "Extension/Plugins/DependencyWatcher/Module";

export interface IRPCSourceConfig {
    rpc: RPC;
}

export class RPCSource {
    protected _rpc: RPC;
    private __lastQueryResult: ModulesRecord<TransferModule> = Object.create(null);
    private __lastBundles: Bundles;
    constructor({ rpc }: IRPCSourceConfig) {
        this._rpc = rpc;
    }

    protected _getModules(): Promise<ModulesMap> {
        return Promise.resolve().then(() => {
            if (!this.__lastQueryResult || !Object.keys(this.__lastQueryResult).length) {
                return this.__getModules();
            }
            return this.__getNewModules();
        }).then((modulesRecord: ModulesRecord<TransferModule>) => {
            this.__lastQueryResult = Object.assign(this.__lastQueryResult, modulesRecord);
            return convertToMap(this.__lastQueryResult);
        });
    }
    
    private __getNewModules(): Promise<ModulesRecord<TransferModule>> {
        return this._rpc.execute<string[]>({
            methodName: RPCMethods.getNewModules
        }).then((dependecies: string[]) => {
            if (!dependecies.length) {
                return Promise.resolve({});
            }
            return this.__getModules(dependecies);
        })
    }
    
    private __getModules(dependecies?: string[]): Promise<ModulesRecord<TransferModule>> {
        return this._rpc.execute<ModulesRecord<TransferModule>, string[] | void>({
            methodName: RPCMethods.getModules,
            args: dependecies
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
    
    protected _setSize(name: string, size: number): Promise<boolean> {
        return this._rpc.execute({
            methodName: RPCMethods.setSize,
            args: {
                name, size
            }
        })
    }
}
