import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IRPCModule, IRPCModeuleFilter, ITransferRPCModule, UpdateItemParam } from "Extension/Plugins/DependencyWatcher/IRPCModule";
import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { RPC } from "Extension/Event/RPC";

interface ItemQueryResult extends QueryResult<number> {

}
interface ItemQueryParam extends Partial<QueryParam<IRPCModule, IRPCModeuleFilter>> {

}

export class Module {
    private __items: Map<number, ITransferRPCModule> = new Map();
    constructor(private _rpc: RPC) {}
    query(queryParams: ItemQueryParam = {}): Promise<ItemQueryResult> {
        return this._rpc.execute<ItemQueryResult, ItemQueryParam>({
            methodName: RPCMethodNames.moduleQuery,
            args: queryParams
        });
    }
    getItems(keys: number[]): Promise<ITransferRPCModule[]> {
        return this.__updateCache(keys).then(() => {
            return keys.map((id: number) => {
                return <ITransferRPCModule> this.__items.get(id);
            });
        })
    }
    updateItems(params: UpdateItemParam[]): Promise<boolean[]> {
        params.forEach((param) => {
            this.__updateItem(param);
        });
        return this._rpc.execute<boolean[], UpdateItemParam[]>({
            methodName: RPCMethodNames.moduleUpdateItems,
            args: params
        });
    }
    private __updateItem(param: UpdateItemParam) {
        const item = this.__items.get(param.id);
        if (!item) {
            return;
        }
        item.fileName = param.fileName || item.fileName;
        item.size = param.size || item.size;
        item.path = param.path || item.path;
    }
    private __updateCache(keys: number[]): Promise<void>  {
        if (!keys.length) {
            return Promise.resolve();
        }
        return this._rpc.execute<boolean[], number[]>({
            methodName: RPCMethodNames.moduleHasUpdates,
            args: keys
        }).then((updated: boolean[]) => {
            const needKeys = [];
            for (let i = 0; i < keys.length; i++) {
                if (updated[i] || !this.__items.has(keys[i])) {
                    needKeys.push(keys[i]);
                }
            }
            if (!needKeys.length) {
                return [];
            }
            return this._rpc.execute<ITransferRPCModule[], number[]>({
                methodName: RPCMethodNames.moduleGetItems,
                args: needKeys
            });
        }).then((items: ITransferRPCModule[]) => {
            items.forEach((item: ITransferRPCModule) => {
               this.__items.set(item.id, item);
            });
        });
    }
    
}
