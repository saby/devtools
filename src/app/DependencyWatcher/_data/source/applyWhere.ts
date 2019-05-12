import { IFilterData, ListItem } from "../../interface/View";
import { PrepareFunction } from "./PrepareFunction";

export let applyWhere = <TTreeData extends ListItem, T extends IFilterData> (
    where: T,
    limits: number
): PrepareFunction<TTreeData> => {
    let { name = '', parent } = where;
    name = name.toLocaleString();
    return (set: TTreeData[]) => {
        console.log('applyWhere =>', where, limits);
        if(!name){
            return set;
        }
        if (where.parent) {
            return set;
        }
        return set.filter((data) => {
            return data.name.toLowerCase().includes(name)
        });
    }
};
