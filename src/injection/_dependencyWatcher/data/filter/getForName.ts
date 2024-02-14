import { FilterFunction, FilterFunctionGetter } from './Filter';

interface IName {
   name: string;
}

export let getForName: FilterFunctionGetter<string, IName> = (
   name: string
): FilterFunction<IName> => {
   const _name = name.toLowerCase();
   return (item: IName) => {
      return item.name.toLowerCase().includes(_name);
   };
};
