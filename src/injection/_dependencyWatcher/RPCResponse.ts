import { IConfigWithStorage } from "./IConfig";
import { RPC } from "Extension/Event/RPC";
import { RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { ModuleStorage } from "./ModuleStorage";
import { ILogger } from "Extension/Logger/ILogger";
import { convertToRecord } from "Extension/Plugins/DependencyWatcher/Module";
import { ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { Require } from "./Require";
import { GLOBAL } from "../const";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";

interface Config extends IConfigWithStorage{
    rpc: RPC,
    require: Require
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
        require
    }: Config) {
        this.__storage = moduleStorage;
        this.__logger = logger;
        this.__require = require;

        rpc.registerMethod(RPCMethods.getBundles, this.getBundles.bind(this));
        rpc.registerMethod(RPCMethods.getModules, this.getModules.bind(this));
        rpc.registerMethod(RPCMethods.getNewModules, this.getNewModules.bind(this));
        rpc.registerMethod(RPCMethods.setSize, this.setSize.bind(this));
    }
    private __storage: ModuleStorage;
    private __logger: ILogger;
    private __require: Require;
    private getBundles() {
        if (GLOBAL.bundles) {
            return GLOBAL.bundles;
        }
        return this.__require.getConfig().bundles;
    }
    private getModules(dependencies?: string[]): ModulesRecord<TransferModule> {
        let modules = this.__storage.getModules(dependencies);
        modules.forEach((module) => {
            if (!module.fileName) {
                module.fileName = this.__getFileName(module.name);
                module.bundle = findFile(this.__require.getConfig().bundles, module.name) || '';
            }
        });
        return convertToRecord(this.__storage.getModules(dependencies));
    }
    private getNewModules(): string[] {
        return this.__storage.getNewModules();
    }
    private __getFileName(name: string) {
        return this.__require.getRequire().toUrl(name).replace(/\?.+/, '');
    }
    private setSize({ name, size }: { name: string, size: number }): boolean {
        let module = this.__storage.getModule(name);
        if (!module) {
            return false;
        }
        module.size = size;
        return true;
    }
}
