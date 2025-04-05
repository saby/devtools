import {
   FilterFunction,
   FilterFunctionGetter
} from './Filter';

const ignoreWrap = <T>(
   f: FilterFunction<T>
): FilterFunctionGetter<boolean, T> => {
   return (ignoreFilter: boolean): FilterFunction<T> => {
      if (ignoreFilter) {
         return () => true;
      }
      return f;
   };
};

export default ignoreWrap;
