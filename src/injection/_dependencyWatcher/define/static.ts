import { IDefine, Args } from "./IDefine";
import { prepareArgs } from "./prepareArgs";
import { ModuleStorage } from "../storage/Module";
import { ILogger } from "Extension/Logger/ILogger";

let regDepsFunction = (storage: ModuleStorage, logger: ILogger) => {
    return (args: Array<Args>) => {
        try {
            let { name, dependencies = [] } = prepareArgs(args);
            if (name) {
                storage.define(name, dependencies);
            }
        }
        catch (error) {
            logger.error(error);
        }
    };
};

export let wrapDefineStatic = (_realDefine: IDefine, storage: ModuleStorage, logger: ILogger): IDefine => {
    let regDeps = regDepsFunction(storage, logger);
    let proxy = (...args: Array<Args>) => {
        regDeps(args);
        return _realDefine(...args);
    };
    return Object.assign(proxy, { amd: {} });
};
