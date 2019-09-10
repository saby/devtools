import { IConfigWithStorage } from './IConfig';
import { RPC } from 'Extension/Event/RPC';
import { RPCMethodNames } from 'Extension/Plugins/DependencyWatcher/const';
import { Require } from './Require';
import { FileStorage } from './storage/File';
import { Module as RPCModulesStorage } from './rpcStorage/Module';

interface IConfig extends IConfigWithStorage {
   rpc: RPC;
   require: Require;
   fileStorage: FileStorage;
}

export class RPCResponse {
   constructor({ rpc, moduleStorage, fileStorage, require }: IConfig) {
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
         RPCMethodNames.moduleUpdateItems,
         rpcModulesStorage.updateItems.bind(rpcModulesStorage)
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
      rpc.registerMethod(
         RPCMethodNames.fileHasUpdates,
         fileStorage.hasUpdates.bind(fileStorage)
      );
      rpc.registerMethod(
         RPCMethodNames.fileUpdateItems,
         fileStorage.updateItems.bind(fileStorage)
      );
   }
}
