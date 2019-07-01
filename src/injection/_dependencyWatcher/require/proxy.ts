import { IRequire } from "./IRequire";
import { ModuleStorage } from "../storage/Module";
import { GLOBAL_MODULE_NAME } from "Extension/Plugins/DependencyWatcher/const";
import { ILogger } from "Extension/Logger/ILogger";

let addDepsFunction = (storage: ModuleStorage, logger: ILogger) => {
    return (argArray: any[]) => {
        try {
            let deps = argArray[0];
            if (typeof deps == 'string') {
                storage.require(GLOBAL_MODULE_NAME, [deps]);
            } else if (Array.isArray(deps)) {
                storage.require(GLOBAL_MODULE_NAME, deps);
            } else if (typeof deps == 'object' && Array.isArray(argArray[1])) {
                storage.require(GLOBAL_MODULE_NAME, argArray[1]);
            }
        }
        catch (error) {
            logger.error(error);
        }
    };
};

export let proxyRequire = (require: IRequire, storage: ModuleStorage, logger: ILogger) => {
    let addDeps = addDepsFunction(storage, logger);
    return new Proxy(require, {
        apply(
            target: any,
            thisArg: any,
            argArray: any[]
        ): any {
            addDeps(argArray);
            return target.apply(thisArg, argArray);
        }
    });
};
