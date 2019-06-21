import { IRequire } from "./IRequire";
import { extensionPlugins } from "./plugins";
import { GLOBAL_MODULE_NAME } from "Extension/Plugins/DependencyWatcher/const";

const IS_DEBUG = document.cookie.indexOf('s3debug=true') > -1;
const RELEASE_MODE = 'release';
const DEBUG_MODE = 'debug';

let clearPath = (path: string) => path.replace(/^\//, '').replace(/\?.+/, '');
let getSuffix = (buildMode: string) => IS_DEBUG || buildMode !== RELEASE_MODE ? '' : '.min';

export let getFileName = (
    moduleName: string,
    require: IRequire,
    bundle: string = '',
    buildMode: string = RELEASE_MODE,
) => {
    if (buildMode == RELEASE_MODE && bundle) {
        return bundle + '.js';
    }
    if (moduleName == GLOBAL_MODULE_NAME) {
        return location.href;
    }
    let path = clearPath(require.toUrl(moduleName));
    if (bundle && bundle == path) {
        return path;
    }
    let name: string = moduleName;
    let extension: string;
    for (let plugin of extensionPlugins) {
        const pluginData = plugin(moduleName);
        if (!pluginData) {
            continue;
        }
        const { module, ext } = pluginData;
        name = module;
        extension = ext;
        break;
    }
    // @ts-ignore
    if (typeof extension == 'undefined') {
        extension = '.js';
    }
    
    return clearPath(require.toUrl(name)) + getSuffix(buildMode) + extension;
};
