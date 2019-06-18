import { ListItem } from "../../types";
import { FilterFunction } from "./Filter";

export let i18n: FilterFunction<ListItem> = <T extends ListItem>(item: T): boolean => {
    return !item.name.startsWith('i18n!');
};
