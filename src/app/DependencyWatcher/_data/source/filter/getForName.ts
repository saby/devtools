import { ListItem } from "../../types";
import { FilterFunction, FilterFunctionGetter } from "./Filter";

export let getForName: FilterFunctionGetter<string> = (name: string = ''): FilterFunction => {
    const _name = name.toLowerCase();
    return (item: ListItem) => {
        return item.name.toLowerCase().includes(_name);
    }
};
