import { IConfigWithStorage } from './IConfig';
import { RPC } from 'Extension/Event/RPC';
import { RPCMethodNames } from 'Extension/Plugins/DependencyWatcher/const';
import { Require } from './Require';
import { FileStorage } from './storage/File';
import { Module as RPCModulesStorage } from './rpcStorage/Module';

interface IConfig extends IConfigWithStorage {
   rpc: RPC;
   require: Require;
}

/**
 * Registers handlers of rpc methods.
 * @author Зайцев А.С.
 */
export default function registerRPCMethods({ rpc, moduleStorage, require }: IConfig): void {
   const fileStorage = new FileStorage();
   const rpcModulesStorage = new RPCModulesStorage(
      moduleStorage,
      fileStorage,
      require
   );
   rpc.registerMethod(
      RPCMethodNames.moduleQuery,
      rpcModulesStorage.query.bind(rpcModulesStorage)
   );
   rpc.registerMethod(
      RPCMethodNames.moduleGetItems,
      rpcModulesStorage.getItems.bind(rpcModulesStorage)
   );
   rpc.registerMethod(
      RPCMethodNames.moduleHasUpdates,
      rpcModulesStorage.hasUpdates.bind(rpcModulesStorage)
   );
   rpc.registerMethod(
      RPCMethodNames.moduleOpenSource,
      rpcModulesStorage.openSource.bind(rpcModulesStorage)
   );

   rpc.registerMethod(
      RPCMethodNames.fileQuery,
      fileStorage.query.bind(fileStorage)
   );
   rpc.registerMethod(
      RPCMethodNames.fileGetItems,
      fileStorage.getItems.bind(fileStorage)
   );
}
