import { IConfigWithStorage } from "./IConfig";
import { RPC } from "Extension/Event/RPC";
import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { ModuleStorage } from "./storage/Module";
import { ILogger } from "Extension/Logger/ILogger";
import { Require } from "./Require";
import { FileStorage } from "./storage/File";
import { isRelease } from "./require/isRelease";
import { Item } from "./storage/Item";

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
        this.__items = new Item(this.__modules, this.__files, this.__require, logger.create('ItemStorage'));
        rpc.registerMethod(RPCMethodNames.getUpdates, this.__modules.getUpdates.bind(this.__modules));
        rpc.registerMethod(RPCMethodNames.openSource, this.__modules.openSource.bind(this.__modules));
        rpc.registerMethod(RPCMethodNames.isRelease, this.isRelease.bind(this));

        rpc.registerMethod(RPCMethodNames.queryItems, this.__items.query.bind(this.__items));
        rpc.registerMethod(RPCMethodNames.getItems, this.__items.getItems.bind(this.__items));
        rpc.registerMethod(RPCMethodNames.updateItems, this.__items.updateItems.bind(this.__items));
    
        rpc.registerMethod(RPCMethodNames.hasUpdates, this.__modules.hasUpdates.bind(this.__modules));
        rpc.registerMethod(RPCMethodNames.queryFiles, this.__files.query.bind(this.__files));
        rpc.registerMethod(RPCMethodNames.getFiles, this.__files.getItems.bind(this.__files));
    }
    private __modules: ModuleStorage;
    private __files: FileStorage;
    private __logger: ILogger;
    private __require: Require;
    private __items: Item;
    private isRelease(): boolean {
        return isRelease(this.__require.getConfig().buildMode);
    }
}
