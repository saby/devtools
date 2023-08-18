import { FilterFunction, FilterFunctionGetter } from './Filter';

interface IIsDeprecated {
   isDeprecated: boolean;
}

export const getDeprecated: FilterFunctionGetter<boolean, IIsDeprecated> = (
   filterValue: boolean
): FilterFunction<IIsDeprecated> => {
   if (!filterValue) {
      return () => true;
   }
   return (item: IIsDeprecated) => {
      return item.isDeprecated;
   };
};
