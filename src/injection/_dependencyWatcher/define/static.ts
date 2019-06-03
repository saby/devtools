import { IDefine, Args } from "./IDefine";
import { prepareArgs } from "./prepareArgs";
import { moduleStorage } from "../moduleStorage";

let regDeps = (args: Array<Args>) => {
    try {
        let { name, dependencies = [] } = prepareArgs(args);
        if (name) {
            moduleStorage.defineModule(name, dependencies);
        }
    }
    catch (e) {
    
    }
};

export let wrapDefineStatic = (_realDefine: IDefine): IDefine => {
    return (...args: Array<Args>) => {
        regDeps(args);
        return _realDefine(...args);
    }
};
