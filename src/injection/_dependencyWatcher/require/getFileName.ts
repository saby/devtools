import { IRequire } from "./IRequire";
import { extensionPlugins } from "./plugins";
import { GLOBAL_MODULE_NAME } from "Extension/Plugins/DependencyWatcher/const";

export let getFileName = (require: IRequire, module: string) => {
    if (module == GLOBAL_MODULE_NAME) {
        return location.href;
    }
    let isFoundExtension: boolean = false;
    let name: string | false;
    for (let plugin of extensionPlugins) {
        name = plugin(module);
        if (name) {
            isFoundExtension = true;
            break;
        }
    }
    let ext: string = '';
    if (!isFoundExtension) {
        name = module;
        ext = '.js';
    }
    //@ts-ignore
    return require.toUrl(name).replace(/\?.+/, ext);
};
