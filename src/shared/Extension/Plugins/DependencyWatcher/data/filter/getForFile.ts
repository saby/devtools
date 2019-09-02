import { FilterFunction, FilterFunctionGetter } from './Filter';
import { getForFiles } from './getForFiles';

interface IWithFileId {
   fileId?: number;
}

export let getForFile: FilterFunctionGetter<number | undefined, IWithFileId> = (
   key?: number
): FilterFunction<IWithFileId> => {
    // TODO: double equals
   return getForFiles(typeof key == 'number' ? [key] : key);
};
