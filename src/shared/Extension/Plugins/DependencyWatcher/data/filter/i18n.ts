import { FilterFunction } from "./Filter";
interface Name {
    name: string;
}
export let i18n: FilterFunction<Name> = <T extends Name>(item: T): boolean => {
    return !item.name.startsWith('i18n!');
};
