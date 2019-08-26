import { FilterFunction } from "./Filter";

interface Name {
    name: string;
}

export let css: FilterFunction<Name> = <T extends Name>(item: T): boolean => {
    return !item.name.startsWith('css!');
};
