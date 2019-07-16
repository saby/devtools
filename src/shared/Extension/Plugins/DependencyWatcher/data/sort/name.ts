import { SortFunction, SortResult } from "./Sort";
import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

/**
 * Удаление префиксов плагинов из имени, чтобы сортировка происходила по "чистому" имени модуля
 * @param {String} str
 * @return {String}
 */
let removePrefix = (str: string) => {
    return str.replace(/.+\!/, '').replace(/.+\?/, '');
};

const name: SortFunction<ModuleInfo> = <T extends ModuleInfo>(first: T, second: T): SortResult => {
    let _first = removePrefix(first.name);
    let _second = removePrefix(second.name);

    return _first.localeCompare(_second, undefined, { sensitivity: 'base' });
};

export default name;
