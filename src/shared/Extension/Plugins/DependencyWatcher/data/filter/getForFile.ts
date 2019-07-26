import { FilterFunction, FilterFunctionGetter } from "./Filter";
import { getForFiles } from "./getForFiles";

interface WithFileId {
    fileId?: number;
}

export let getForFile: FilterFunctionGetter<number | undefined, WithFileId> = (key?: number): FilterFunction<WithFileId> => {
    return getForFiles(typeof key == 'number'? [key]: key);
};
