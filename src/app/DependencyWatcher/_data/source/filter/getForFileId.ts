import { ListItem } from "../../types";
import { FilterFunction, FilterFunctionGetter } from "./Filter";

export let getForFileId: FilterFunctionGetter<number> = (fileId: number): FilterFunction => {
    return (item: ListItem) => {
        if (item.parent) {
            return true;
        }
        return item.fileId == fileId;
    }
};
