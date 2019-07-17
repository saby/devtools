import { FilterFunction } from "./Filter";
interface Name {
    name: string;
}
export let json: FilterFunction<Name> = <T extends Name>(item: T): boolean => {
    return !item.name.startsWith('json!') && !item.name.includes('.json');
};
