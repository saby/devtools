import {
   IQueryParam,
   IQueryResult
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import {
   IRPCModule,
   IRPCModuleFilter,
   ITransferRPCModule
} from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { RPCMethodNames } from 'Extension/Plugins/DependencyWatcher/const';
import { RPC } from 'Extension/Event/RPC';

interface IItemQueryResult extends IQueryResult<number> {}
interface IItemQueryParam
   extends Partial<IQueryParam<IRPCModule, IRPCModuleFilter>> {}

/**
 * Module storage on the frontend.
 * @author Зайцев А.С.
 */
export class Module {
   private _items: Map<number, ITransferRPCModule> = new Map();
   constructor(private _rpc: RPC) {}
   query(queryParams: IItemQueryParam): Promise<IItemQueryResult> {
      return this._rpc.execute<IItemQueryResult, IItemQueryParam>({
         methodName: RPCMethodNames.moduleQuery,
         args: queryParams
      });
   }
   getItems(keys: number[]): Promise<ITransferRPCModule[]> {
      return this.__updateCache(keys).then(() => {
         return keys.map((id: number) => {
            return this._items.get(id) as ITransferRPCModule;
         });
      });
   }
   private __updateCache(keys: number[]): Promise<void> {
      if (!keys.length) {
         return Promise.resolve();
      }
      return this._rpc
         .execute<boolean[], number[]>({
            methodName: RPCMethodNames.moduleHasUpdates,
            args: keys
         })
         .then((updated: boolean[]) => {
            const needKeys = [];
            for (let i = 0; i < keys.length; i++) {
               if (updated[i] || !this._items.has(keys[i])) {
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
         })
         .then((items: ITransferRPCModule[]) => {
            items.forEach((item: ITransferRPCModule) => {
               this._items.set(item.id, item);
            });
         });
   }
}
