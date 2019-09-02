import { IConfigWithStorage } from './IConfig';
import { RPC } from 'Extension/Event/RPC';
import { RPCMethodNames } from 'Extension/Plugins/DependencyWatcher/const';
import { ModuleStorage } from './storage/Module';
import { ILogger } from 'Extension/Logger/ILogger';
import { Require } from './Require';
import { FileStorage } from './storage/File';
import { Module as RPCModulesStorage } from './rpcStorage/Module';

interface IConfig extends IConfigWithStorage {
   rpc: RPC;
   require: Require;
   fileStorage: FileStorage;
}

export class RPCResponse {
   private readonly _modules: ModuleStorage;
   private readonly _files: FileStorage;
   private readonly _logger: ILogger;
   private readonly _require: Require;
   private readonly _rpcModules: RPCModulesStorage;
   constructor({ rpc, logger, moduleStorage, fileStorage, require }: IConfig) {
      this._modules = moduleStorage;
      this._files = fileStorage;
      this._logger = logger;
      this._require = require;
      this._rpcModules = new RPCModulesStorage(
         this._modules,
         this._files,
         this._require,
         logger.create('RPCModulesStorage')
      );
      rpc.registerMethod(
         RPCMethodNames.moduleQuery,
         this._rpcModules.query.bind(this._rpcModules)
      );
      rpc.registerMethod(
         RPCMethodNames.moduleGetItems,
         this._rpcModules.getItems.bind(this._rpcModules)
      );
      rpc.registerMethod(
         RPCMethodNames.moduleHasUpdates,
         this._rpcModules.hasUpdates.bind(this._rpcModules)
      );
      rpc.registerMethod(
         RPCMethodNames.moduleUpdateItems,
         this._rpcModules.updateItems.bind(this._rpcModules)
      );
      rpc.registerMethod(
         RPCMethodNames.moduleOpenSource,
         this._rpcModules.openSource.bind(this._rpcModules)
      );

      rpc.registerMethod(
         RPCMethodNames.fileQuery,
         this._files.query.bind(this._files)
      );
      rpc.registerMethod(
         RPCMethodNames.fileGetItems,
         this._files.getItems.bind(this._files)
      );
      rpc.registerMethod(
         RPCMethodNames.fileHasUpdates,
         this._files.hasUpdates.bind(this._files)
      );
      rpc.registerMethod(
         RPCMethodNames.fileUpdateItems,
         this._files.updateItems.bind(this._files)
      );
   }
}
