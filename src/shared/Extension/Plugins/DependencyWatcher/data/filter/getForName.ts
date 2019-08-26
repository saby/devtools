import { FilterFunction, FilterFunctionGetter } from "./Filter";

interface Name {
    name: string;
}

export let getForName: FilterFunctionGetter<string, Name> = (name: string = ''): FilterFunction<Name> => {
    if (!name) {
        return () => true;
    }
    const _name = name.toLowerCase();
    return (item: Name) => {
        return item.name.toLowerCase().includes(_name);
    }
};
