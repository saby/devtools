import { SortFunction, SortResult } from "./Sort";
import { IModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

/**
 * Удаление префиксов плагинов из имени, чтобы сортировка происходила по "чистому" имени модуля
 * @param {String} str
 * @return {String}
 */
let removePrefix = (str: string) => {
    return str.replace(/.+\!/, '').replace(/.+\?/, '');
};

interface Name {
    name: string;
}

const name: SortFunction<Name> = <T extends Name>(first: T, second: T): SortResult => {
    let _first = removePrefix(first.name);
    let _second = removePrefix(second.name);

    return _first.localeCompare(_second, undefined, { sensitivity: 'base' });
};

export default name;
