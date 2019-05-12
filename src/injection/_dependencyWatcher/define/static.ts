import { IDefine, Args } from "./IDefine";
import { prepareArgs } from "./prepareArgs";
import { moduleStorage } from "../moduleStorage";

export let wrapDefineStatic = (_realDefine: IDefine): IDefine => {
    return (...args: Array<Args>) => {
        let { name, dependencies = [] } = prepareArgs(args);
        if (name) {
            moduleStorage.defineModule(name, dependencies);
        }
        return _realDefine(...args);
    }
};
