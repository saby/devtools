import { IRequire } from "./IRequire";
import { moduleStorage } from "../moduleStorage";
import { GLOBAL_MODULE_NAME } from "Extension/Plugins/DependencyWatcher/const";

let addDeps = (argArray: any[]) => {
    try {
        let deps = argArray[0];
        if (typeof deps == 'string') {
            moduleStorage.addDependency(GLOBAL_MODULE_NAME, [deps]);
        } else if (Array.isArray(deps)) {
            moduleStorage.addDependency(GLOBAL_MODULE_NAME, deps);
        } else if (typeof deps == 'object' && Array.isArray(argArray[1])) {
            moduleStorage.addDependency(GLOBAL_MODULE_NAME, argArray[1]);
        }
    }
    catch (e) {
    
    }
};

export let proxyRequire = (require: IRequire) => {
    return new Proxy(require, {
        apply(
            target: any,
            thisArg: any,
            argArray: any[]
        ): any {
            addDeps(thisArg);
            return target.apply(thisArg, argArray);
        }
    });
};
