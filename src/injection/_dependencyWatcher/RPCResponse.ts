import { IConfigWithStorage } from "./IConfig";
import { RPC } from "Extension/Event/RPC";
import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { ModuleStorage } from "./storage/Module";
import { ILogger } from "Extension/Logger/ILogger";
import { convertToRecord } from "Extension/Plugins/DependencyWatcher/Module";
import { IModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { Require } from "./Require";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { getFileName } from "./require/getFileName";
import { FileStorage } from "./storage/File";
import { RPCMethodsArgs, RPCMethodsResult } from "Extension/Plugins/DependencyWatcher/RPCMethods";
import { IFile, Stack } from "Extension/Plugins/DependencyWatcher/IFile";
import { isRelease } from "./require/isRelease";

interface Config extends IConfigWithStorage{
    rpc: RPC;
    require: Require;
    fileStorage: FileStorage;
}

let findFile = (bundles: Bundles, module: string): string | void => {
    for (let fileName in bundles) {
        if (bundles[fileName].includes(module)) {
            return fileName;
        }
    }
};
const sortByInit = (first: IModule, second: IModule) => {
    // return first.initNumber - second.initNumber
    return 0;
};

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

        rpc.registerMethod(RPCMethodNames.getModules, this.getModules.bind(this));
        rpc.registerMethod(RPCMethodNames.getUpdates, this.__modules.getUpdates.bind(this.__modules));
        rpc.registerMethod(RPCMethodNames.setSize, this.setSize.bind(this));
        rpc.registerMethod(RPCMethodNames.getFiles, this.getFiles.bind(this));
        rpc.registerMethod(RPCMethodNames.isRelease, this.isRelease.bind(this));
        rpc.registerMethod(RPCMethodNames.getStacks, this.getStacks.bind(this));
    }
    private __modules: ModuleStorage;
    private __files: FileStorage;
    private __logger: ILogger;
    private __require: Require;
    private getModules(keys: RPCMethodsArgs[RPCMethodNames.getModules]): RPCMethodsResult[RPCMethodNames.getModules] {
        const _require = this.__require.getOrigin();
        const modules = this.__modules.getModules(keys);
        modules.forEach((module) => {
            if (!module.fileId) {
                this.__addFileId(module);
            }
            if (!module.defined) {
                module.defined = _require.defined(module.name);
            }
        });
        return convertToRecord(modules);
    }
    private __addFileId(module: IModule) {
        const bundle = findFile(this.__require.getConfig().bundles, module.name) || '';
        const name = getFileName(
            module.name,
            this.__require.getOrigin(),
            bundle,
            this.__require.getConfig().buildMode
        );
        const file: IFile = this.__files.find(name) || this.__files.create(name, 0);
        file.modules.add(module.id);
        module.fileId = file.id;
    }
    private setSize({ size, fileId }: RPCMethodsArgs[RPCMethodNames.setSize]): RPCMethodsResult[RPCMethodNames.setSize] {
        let file: IFile | void;
        if (fileId) {
            file = this.__files.getItem(fileId);
        }
        if (!file) {
            return false;
        }
        file.size = size;
        return true;
    }
    private getFiles(idList?: number[]): IFile[] {
        return this.__files.getItems(idList)
    }
    private isRelease(): boolean {
        return isRelease(this.__require.getConfig().buildMode);
    }
    
    private getStacks(keys: number[]): Record<number, Stack> {
        return {};
    }
}
