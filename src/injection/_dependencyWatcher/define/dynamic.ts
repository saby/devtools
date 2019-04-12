import { IDefine} from "./IDefine";
import { REQUIRE } from "../const";
import { prepareArgs } from "./prepareArgs";
import { wrapDefineStatic } from './static';
import { proxyModules } from './proxyModules';
import { replaceDependencies } from './replaceDependency';

let isNeedDynamicWrapper = (
    constructorFunction: void | Function,
    dependencies: void | Array<string>,
    dependencyName: string,
    name: string | void
): boolean => {
    return !!(
        name &&
        constructorFunction &&
        dependencies &&
        dependencies.includes(dependencyName)
    )
};

export let wrapDefineDynamic = (_realDefine: IDefine): IDefine => {
    let dynamicDefine = (...defineArgs) => {
        let { dependencies, constructorFunction, name } = prepareArgs(defineArgs);
        if (!isNeedDynamicWrapper(constructorFunction, dependencies, REQUIRE, name)) {
            return _realDefine(...defineArgs);
        }
        return _realDefine(
            // @ts-ignore
            name,
            dependencies,
        (...moduleArgs) => {
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
    return  wrapDefineStatic(dynamicDefine);
};


