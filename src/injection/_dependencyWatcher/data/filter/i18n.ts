import { FilterFunction } from './Filter';
interface IName {
   name: string;
}
export let i18n: FilterFunction<IName> = <T extends IName>(
   item: T
): boolean => {
   return !item.name.startsWith('i18n!');
};
