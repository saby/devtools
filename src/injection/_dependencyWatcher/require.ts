import { IPropertyDescriptorGetter } from "./IPropertyDescriptorGetter";
import { IRequire, IRequireInitObject } from "./require/IRequire";
import { proxyRequire } from "./require/proxy";

export let require: IPropertyDescriptorGetter = () => {
    let _realRequire: IRequire;
    let _requireInit: IRequireInitObject;
    let _proxyRequire: IRequire;
    return {
        set(value: IRequire | IRequireInitObject) {
            if (typeof value === 'function') {
                _realRequire = <IRequire> value;
                _proxyRequire = proxyRequire(_realRequire);
            } else {
                _requireInit = value;
            }
        },
        get(): IRequire | IRequireInitObject | void {
            return _proxyRequire || _requireInit;
        }
    }
};
