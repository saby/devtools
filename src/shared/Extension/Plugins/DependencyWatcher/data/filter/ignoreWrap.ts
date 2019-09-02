import {
   FilterFunction,
   FilterFunctionGetter
} from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';

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
