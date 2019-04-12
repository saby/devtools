import { addDependency } from "../notify/addDependency";
import { REQUIRE } from "../const";

type ReplaceFunction<T = any> = (name: string, origin: T) => T;
type IRequire = () => {};

let proxyRequire: ReplaceFunction<IRequire> = (name: string, require: IRequire) => {
    return new Proxy(require, {
        apply(target: any, thisArg: any, argArray?: Array<any>): any {
            addDependency(name, argArray[0]);
            return target.apply(thisArg, argArray);
        }
    });
};

let proxyModuleStubs: ReplaceFunction<any> = (name: string, moduleStubs) => {
    return new Proxy(moduleStubs, {
        get(target: any, property: string | number | symbol, receiver: any): any {
            if (property === 'requireModule' || property === 'require') {
                return (mods) => {
                    addDependency(name, mods);
                    return target[property].call(target, mods);
                };
            }
            return target[property];
        }
    })
};

let proxyLibrary: ReplaceFunction<any> = (name: string, library) => {
    return new Proxy(library, {
        get(target: any, property: string | number | symbol, receiver: any): any {
            if (property === 'load') {
                return (module, loader) => {
                    addDependency(name, target.parse(module).name);
                    return target[property].call(target, module, loader);
                };
            }
            return target[property];
        }
    })
};

export let proxyModules = {
    [REQUIRE]: proxyRequire,
    'Core/library': proxyLibrary,
    'Core/moduleStubs': proxyModuleStubs
};
