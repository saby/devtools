import { SortFunction, SortResult } from './Sort';

/**
 * Удаление префиксов плагинов из имени, чтобы сортировка происходила по "чистому" имени модуля
 * @param {String} str
 * @return {String}
 */
function removePrefix(str: string): string {
   return str.replace(/.+\!/, '').replace(/.+\?/, '');
}

interface IName {
   name: string;
}

const name: SortFunction<IName> = <T extends IName>(
   first: T,
   second: T
): SortResult => {
   const _first = removePrefix(first.name);
   const _second = removePrefix(second.name);

   return _first.localeCompare(_second, undefined, { sensitivity: 'base' });
};

export default name;
