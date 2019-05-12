import { REQUIRE } from "../const";
import { ILocalRequire } from "../require/IRequire";
import { moduleStorage } from "../moduleStorage";

type ReplaceFunction<T = any> = (name: string, origin: T) => T;

let proxyRequire: ReplaceFunction<ILocalRequire> = (name: string, require: ILocalRequire) => {
    return new Proxy(require, {
        apply(target: any, thisArg: any, argArray: Array<string | string[]>): any {
            moduleStorage.addDependency(name, argArray[0]);
            return target.apply(thisArg, argArray);
        }
    });
};

let proxyModuleStubs: ReplaceFunction<any> = (name: string, moduleStubs) => {
    return new Proxy(moduleStubs, {
        get(target: any, property: string | number | symbol, receiver: any): any {
            if (property === 'requireModule' || property === 'require') {
                return (mods: string | string[]) => {
                    moduleStorage.addDependency(name, mods);
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
                return (module: string, loader?: unknown) => {
                    moduleStorage.addDependency(name, target.parse(module).name);
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
