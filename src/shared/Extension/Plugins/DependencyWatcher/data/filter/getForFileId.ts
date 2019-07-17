import { FilterFunction, FilterFunctionGetter } from "./Filter";

interface FileId {
    fileId?: number;
}

export let getForFileId: FilterFunctionGetter<number, FileId> = (fileId: number): FilterFunction<FileId> => {
    return (item: FileId) => {
        return item.fileId == fileId;
    }
};
