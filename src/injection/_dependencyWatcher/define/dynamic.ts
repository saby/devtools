import { IDefine} from "./IDefine";
import { prepareArgs } from "./prepareArgs";
import { wrapDefineStatic } from './static';
import { getProxyModules } from './proxyModules';
import { replaceDependencies } from './replaceDependency';
import { ModuleStorage } from "../ModuleStorage";
import { ILogger } from "Extension/Logger/ILogger";

let isNeedDynamicWrapper = (
    constructorFunction: void | Function,
    moduleDependencies: void | string[],
    replacedModules: string[],
    name: string | void
): boolean => {
    return !!(
        name &&
        constructorFunction &&
        moduleDependencies
    ) &&
    moduleDependencies.some((dependency: string) => {
        return replacedModules.includes(dependency);
    })
};

export let wrapDefineDynamic = (_realDefine: IDefine, storage: ModuleStorage, logger: ILogger): IDefine => {
    let proxyModules = getProxyModules(storage, logger);
    let replacedModules: string[] = Object.keys(proxyModules);

    let dynamicDefine = (...defineArgs: any[]) => {
        let { dependencies, constructorFunction, name } = prepareArgs(defineArgs);
        if (!isNeedDynamicWrapper(constructorFunction, dependencies, replacedModules, name)) {
            return _realDefine(...defineArgs);
        }
        return _realDefine(
            // @ts-ignore
            name,
            dependencies,
        (...moduleArgs: any[]) => {
            let newModuleArgs = replaceDependencies({
                proxyModules,
                args: moduleArgs,
                // @ts-ignore
                dependencies,
                // @ts-ignore
                moduleName: name
            });
            // @ts-ignore
            return constructorFunction(...newModuleArgs);
        });
    };
    return  wrapDefineStatic(dynamicDefine, storage, logger);
};


