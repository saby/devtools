import { ListItem } from "../../types";
import { FilterFunction } from "./Filter";

export let css: FilterFunction<ListItem> = <T extends ListItem>(item: T): boolean => {
    return !item.name.startsWith('css!');
};
