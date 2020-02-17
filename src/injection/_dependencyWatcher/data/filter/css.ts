import { FilterFunction } from './Filter';

interface IName {
   name: string;
}

export let css: FilterFunction<IName> = <T extends IName>(item: T): boolean => {
   return !item.name.startsWith('css!');
};
