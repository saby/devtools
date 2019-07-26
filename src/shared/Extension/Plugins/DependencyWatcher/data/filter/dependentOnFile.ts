import { FilterFunction, FilterFunctionGetter } from "./Filter";

interface WithFileId {
    fileId?: number;
}

interface Dependent {
    dependency: Set<WithFileId>
}

export let dependentOnFile: FilterFunctionGetter<number[] | undefined, Dependent> = (keys?: number[]): FilterFunction<Dependent> => {
    if (!keys || !keys.length) {
        return () => true;
    }
    return (item: Dependent) => {
        const { dependency } = item;
        
        return [...dependency].some(({ fileId }) => {
        
        });
    }
};
