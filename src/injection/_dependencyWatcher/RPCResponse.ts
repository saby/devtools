import { IConfigWithStorage } from "./IConfig";
import { RPC } from "Extension/Event/RPC";
import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { ModuleStorage } from "./storage/Module";
import { ILogger } from "Extension/Logger/ILogger";
import { Require } from "./Require";
import { FileStorage } from "./storage/File";
import { Module as RPCModulesStorage } from "./rpcStorage/Module";

interface Config extends IConfigWithStorage{
    rpc: RPC;
    require: Require;
    fileStorage: FileStorage;
}

export class RPCResponse {
    constructor({
        rpc,
        logger,
        moduleStorage,
        fileStorage,
        require
    }: Config) {
        this.__modules = moduleStorage;
        this.__files = fileStorage;
        this.__logger = logger;
        this.__require = require;
        this.__rpcModules = new RPCModulesStorage(
            this.__modules,
            this.__files,
            this.__require,
            logger.create('RPCModulesStorage')
        );
        rpc.registerMethod(RPCMethodNames.moduleQuery, this.__rpcModules.query.bind(this.__rpcModules));
        rpc.registerMethod(RPCMethodNames.moduleGetItems, this.__rpcModules.getItems.bind(this.__rpcModules));
        rpc.registerMethod(RPCMethodNames.moduleHasUpdates, this.__rpcModules.hasUpdates.bind(this.__rpcModules));
        rpc.registerMethod(RPCMethodNames.moduleUpdateItems, this.__rpcModules.updateItems.bind(this.__rpcModules));
        rpc.registerMethod(RPCMethodNames.moduleOpenSource, this.__rpcModules.openSource.bind(this.__rpcModules));
    
        rpc.registerMethod(RPCMethodNames.fileQuery, this.__files.query.bind(this.__files));
        rpc.registerMethod(RPCMethodNames.fileGetItems, this.__files.getItems.bind(this.__files));
        rpc.registerMethod(RPCMethodNames.fileHasUpdates, this.__files.hasUpdates.bind(this.__files));
        rpc.registerMethod(RPCMethodNames.fileUpdateItems, this.__files.updateItems.bind(this.__files));
    }
    private readonly __modules: ModuleStorage;
    private readonly __files: FileStorage;
    private readonly __logger: ILogger;
    private readonly __require: Require;
    private readonly __rpcModules: RPCModulesStorage;
}
