import { IConfigWithStorage } from "./IConfig";
import { RPC } from "Extension/Event/RPC";
import { RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { ModuleStorage } from "./storage/Module";
import { ILogger } from "Extension/Logger/ILogger";
import { convertToRecord } from "Extension/Plugins/DependencyWatcher/Module";
import { Module, ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { Require } from "./Require";
import { GLOBAL } from "../const";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { getFileName } from "./require/getFileName";
import { FileStorage } from "./storage/File";
import { RPCMethodsArgs, RPCMethodsResult } from "Extension/Plugins/DependencyWatcher/RPCMethods";
import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";
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

        rpc.registerMethod(RPCMethods.getBundles, this.getBundles.bind(this));
        rpc.registerMethod(RPCMethods.getModules, this.getModules.bind(this));
        rpc.registerMethod(RPCMethods.getNewModules, this.__modules.getNewModules.bind(this.__modules));
        rpc.registerMethod(RPCMethods.setSize, this.setSize.bind(this));
        rpc.registerMethod(RPCMethods.getFiles, this.getFiles.bind(this));
        rpc.registerMethod(RPCMethods.isRelease, this.isRelease.bind(this));
    }
    private __modules: ModuleStorage;
    private __files: FileStorage;
    private __logger: ILogger;
    private __require: Require;
    private getBundles() {
        if (GLOBAL.bundles) {
            return GLOBAL.bundles;
        }
        return this.__require.getConfig().bundles;
    }
    private getModules(dependencies?: string[]): ModulesRecord<TransferModule> {
        let modules = this.__modules.getModules(dependencies);
        modules.forEach((module) => {
            if (!module.fileId) {
                this.__addFileId(module);
            }
        });
        return convertToRecord(this.__modules.getModules(dependencies));
    }
    private __addFileId(module: Module) {
        const bundle = findFile(this.__require.getConfig().bundles, module.name) || '';
        const name = getFileName(
            module.name,
            this.__require.getRequire(),
            bundle,
            this.__require.getConfig().buildMode
        );
        const file: IFile = this.__files.find(name) || this.__files.create(name, 0);
        file.modules.add(module.id);
        module.fileId = file.id;
    }
    private setSize({ size, fileId, fileName }: RPCMethodsArgs[RPCMethods.setSize]): RPCMethodsResult[RPCMethods.setSize] {
        let file: IFile | void;
        if (fileId) {
            file = this.__files.getItemById(fileId);
        } else if (fileName) {
            file = this.__files.getItemByName(fileName);
        }
        if (!file) {
            return false;
        }
        file.size = size;
        return true;
    }
    private getFiles(idList?: number[]): IFile[] {
        return Array.from(this.__files.getItemsById(idList))
    }
    private isRelease(): boolean {
        return isRelease(this.__require.getConfig().buildMode);
    }
}
