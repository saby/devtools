import { IRequire } from "./IRequire";
import { pathPlugins } from "./pathPlugins";
import { GLOBAL_MODULE_NAME } from "Extension/Plugins/DependencyWatcher/const";

const findFile = (bundles: Record<string, string[]>, module: string): string | void => {
    for (let fileName in bundles) {
        if (bundles.hasOwnProperty(fileName) && bundles[fileName].includes(module)) {
            return fileName;
        }
    }
};

const getBundle = (
    moduleName: string,
    bundles: Record<string, string[]>,
    isRelease: boolean
): string | void => {
    if (!isRelease) {
        return;
    }
    const bundle = findFile(bundles, moduleName);
    if (bundle) {
        return bundle + '.js';
    }
};

export let getFileName = (
    moduleName: string,
    require: IRequire,
    isRelease: boolean,
    bundles: Record<string, string[]>
): string => {
    if (moduleName == GLOBAL_MODULE_NAME) {
        return location.href;
    }
    const bundle = getBundle(moduleName, bundles, isRelease);
    if (bundle) {
        return bundle;
    }
    for (let plugin of pathPlugins) {
        const path = plugin(moduleName, require, isRelease);
        if (path) {
            return path;
        }
    }
    return  require.toUrl(moduleName);
};
