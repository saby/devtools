import { IDefine, Args } from "./IDefine";
import { prepareArgs } from "./prepareArgs";
import { defineModule } from '../notify/defineModule';

export let wrapDefineStatic = (_realDefine: IDefine): IDefine => {
    return (...args: Array<Args>) => {
        let { name, dependencies } = prepareArgs(args);
        if (name) {
            defineModule(name, dependencies);
        }
        return _realDefine(...args);
    }
};
