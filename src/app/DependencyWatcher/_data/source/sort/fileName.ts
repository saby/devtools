import { SortFunction, SortResult } from "./Sort";
import { ListItem } from "../../types";

export let fileName: SortFunction<ListItem> = <T extends ListItem>(firstItem: T, secondItem: T): SortResult => {
    const first: string = firstItem.fileName || '';
    const second: string = secondItem.fileName || '';
    return first.localeCompare(
        second,
        undefined,
        { sensitivity: 'base' }
    );
};
