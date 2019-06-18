import { ListItem } from "../../types";
import { FilterFunction, FilterFunctionGetter } from "./Filter";

export let getForName: FilterFunctionGetter = <T extends ListItem>({ name = '' }): FilterFunction<T> => {
    const _name = name.toLowerCase();
    return (item: T) => {
        return item.name.toLowerCase().includes(_name);
    }
};
