import { FilterFunction, FilterFunctionGetter } from './Filter';
interface ISize {
   size: number;
}

const filter: FilterFunction<ISize> = <T extends ISize>(item: T): boolean => {
   return !item.size;
};

const withoutSizeGetter: FilterFunctionGetter<boolean, ISize> = <
   T extends ISize
>(
   withoutSize: boolean
) => {
   if (withoutSize) {
      return filter;
   }
   return () => true;
};

export default withoutSizeGetter;
