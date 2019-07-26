import { FilterFunction, FilterFunctionGetter } from "./Filter";

interface WithFileId {
    fileId?: number;
}

export let getForFiles: FilterFunctionGetter<number[] | undefined, WithFileId> = (keys?: number[]): FilterFunction<WithFileId> => {
    
    /*
     * из-за того что resetValue у фильтра не сбрасывается в undefined, пришлось поставить там null,
     * но при этом надо не фильтровать
     * TODO:
     * https://online.sbis.ru/opendoc.html?guid=e8a934bb-533c-4506-aab9-d4e7a0e9d55b
     */
    if (!keys || !keys.length) {
        return () => true;
    }
    return (item: WithFileId) => {
        return keys.includes(<number> item.fileId);
    }
};
