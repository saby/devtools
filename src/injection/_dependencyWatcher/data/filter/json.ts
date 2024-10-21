import { FilterFunction } from './Filter';
interface IName {
   name: string;
}
export let json: FilterFunction<IName> = <T extends IName>(
   item: T
): boolean => {
   return !item.name.startsWith('json!') && !item.name.includes('.json');
};
