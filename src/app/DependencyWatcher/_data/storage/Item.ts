import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IItem, IItemFilter, ITransferItem, UpdateItemParam } from "Extension/Plugins/DependencyWatcher/IItem";
import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { RPC } from "Extension/Event/RPC";

interface ItemQueryResult extends QueryResult<number> {

}
interface ItemQueryParam extends Partial<QueryParam<IItem, IItemFilter>> {

}

export class Item {
    private __items: Map<number, ITransferItem> = new Map();
    constructor(private _rpc: RPC) {}
    query(queryParams: ItemQueryParam = {}): Promise<ItemQueryResult> {
        return this._rpc.execute<ItemQueryResult, ItemQueryParam>({
            methodName: RPCMethodNames.queryItems,
            args: queryParams
        });
    }
    getItems(keys: number[]): Promise<ITransferItem[]> {
        return this.__updateCache(keys).then(() => {
            return keys.map((id: number) => {
                return <ITransferItem> this.__items.get(id);
            });
        })
    }
    updateItems(params: UpdateItemParam[]): Promise<boolean[]> {
        params.forEach((param) => {
            this.__updateItem(param);
        });
        return this._rpc.execute<boolean[], UpdateItemParam[]>({
            methodName: RPCMethodNames.updateItems,
            args: params
        });
    }
    updateItem(param: UpdateItemParam): Promise<boolean> {
        this.__updateItem(param);
        return this._rpc.execute<boolean, UpdateItemParam>({
            methodName: RPCMethodNames.updateItem,
            args: param
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
    private __updateCache(keys: number[]) {
        if (!keys.length) {
            return Promise.resolve();
        }
        return this._rpc.execute<boolean[], number[]>({
            methodName: RPCMethodNames.hasUpdates,
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
            return this._rpc.execute<ITransferItem[], number[]>({
                methodName: RPCMethodNames.getItems,
                args: needKeys
            });
        }).then((items: ITransferItem[]) => {
            items.forEach((item: ITransferItem) => {
               this.__items.set(item.id, item);
            });
        });
    }
    
}
