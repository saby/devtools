import { REQUIRE } from "../const";
import { ILocalRequire } from "../require/IRequire";
import { ModuleStorage } from "../moduleStorage";
import { ILogger } from "Extension/Logger/ILogger";

type ReplaceFunction<T = any> = (name: string, origin: T) => T;

export let getProxyModules = (storage: ModuleStorage, logger: ILogger) => {
    
    let proxyRequire: ReplaceFunction<ILocalRequire> = (name: string, require: ILocalRequire) => {
        return new Proxy(require, {
            apply(target: any, thisArg: any, argArray: Array<string | string[]>): any {
                storage.require(name, argArray[0]);
                return target.apply(thisArg, argArray);
            }
        });
    };
    
    let proxyModuleStubs: ReplaceFunction<any> = (name: string, moduleStubs) => {
        return new Proxy(moduleStubs, {
            get(target: any, property: string | number | symbol, receiver: any): any {
                if (property === 'requireModule' || property === 'require') {
                    return (mods: string | string[]) => {
                        storage.require(name, mods);
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
                        storage.require(name, target.parse(module).name);
                        return target[property].call(target, module, loader);
                    };
                }
                return target[property];
            }
        })
    };
    
    return {
        [REQUIRE]: proxyRequire,
        'Core/library': proxyLibrary,
        'Core/moduleStubs': proxyModuleStubs
    };
};
