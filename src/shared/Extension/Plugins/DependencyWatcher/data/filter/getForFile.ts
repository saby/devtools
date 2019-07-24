import { FilterFunction, FilterFunctionGetter } from "./Filter";
import { IFileId } from "Extension/Plugins/DependencyWatcher/IFile";

interface WithFileId {
    fileId?: number;
}

export let getForFile: FilterFunctionGetter<IFileId, WithFileId> = ({ id }: IFileId): FilterFunction<WithFileId> => {
    
    /*
     * из-за того что resetValue у фильтра не сбрасывается в undefined, пришлось поставить там null,
     * но при этом надо не фильтровать
     * TODO:
     * https://online.sbis.ru/opendoc.html?guid=e8a934bb-533c-4506-aab9-d4e7a0e9d55b
     */
    if (id === null) {
        return () => true;
    }
    return (item: WithFileId) => {
        return item.fileId == id;
    }
};
