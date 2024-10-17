import { FilterFunction, FilterFunctionGetter } from './Filter';
import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';

export let dependentOnFiles: FilterFunctionGetter<number[], IModule> = (
   keys: number[]
): FilterFunction<IModule> => {
   return (item: IModule) => {
      if (keys.includes(item.fileId)) {
         return false;
      }
      const { dependencies }: IModule = item;
      return [
         ...Array.from(dependencies.static),
         ...Array.from(dependencies.dynamic)
      ].some(({ fileId }) => {
         return keys.includes(fileId);
      });
   };
};
