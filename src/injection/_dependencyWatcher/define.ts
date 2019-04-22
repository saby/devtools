import { wrapDefineStatic } from './define/static';
import { wrapDefineDynamic } from './define/dynamic';
import { IPropertyDescriptorGetter } from "./IPropertyDescriptorGetter";
import { IConfig } from "./IConfig";
import { IDefine } from "./define/IDefine";

let wrapDefine = (config: IConfig, realDefine: IDefine): IDefine => {
    if (config.watchDynamicDependency || 1) {
        return wrapDefineDynamic(realDefine);
    }
    return wrapDefineStatic(realDefine);
};

export let define: IPropertyDescriptorGetter = (config: IConfig) => {
    let _realDefine: IDefine;
    let _wrappedDefine: IDefine;
    return {
        set(value: IDefine) {
            _realDefine = value;
        },
        get(): IDefine| void {
            if (!_realDefine) {
                return;
            }
            if (!_wrappedDefine) {
                _wrappedDefine = wrapDefine(config, _realDefine);
            }
            return _wrappedDefine;
        }
    }
};
