import { SortFunction, SortResult } from './Sort';

interface ISize {
   size: number;
}

const size: SortFunction<ISize> = <T extends ISize>(
   first: T,
   second: T
): SortResult => {
   const _first: number = first.size;
   const _second: number = second.size;

   return _first - _second;
};

export default size;
