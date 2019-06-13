import { SortFunction, SortResult } from "./Sort";
import { ListItem } from "../../types";

/**
 * Удаление префиксов плагинов из имени, чтобы сортировка происходила по "чистому" имени модуля
 * @param {String} str
 * @return {String}
 */
let removePrefix = (str: string) => {
    return str.replace(/.+\!/, '').replace(/.+\?/, '');
};

export let name: SortFunction<ListItem> = <T extends ListItem>(first: T, second: T): SortResult => {
    let _first = removePrefix(first.name);
    let _second = removePrefix(second.name);

    return _first.localeCompare(_second, undefined, { sensitivity: 'base' });
};
