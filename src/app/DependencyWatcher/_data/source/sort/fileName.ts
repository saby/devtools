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

export let fileName: SortFunction<ListItem> = <T extends ListItem>(first: T, second: T): SortResult => {
    let _first = first.fileName? removePrefix(first.fileName): '';
    let _second = second.fileName? removePrefix(second.fileName): '';

    return _first.localeCompare(_second, undefined, { sensitivity: 'base' });
};
