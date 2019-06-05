import { IFilterData, ListItem } from "../../../types";
import { PrepareFunction } from "../../util/PrepareFunction";

export let applyWhere = <TTreeData extends ListItem, T extends IFilterData> (
    where: T,
    limits: number
): PrepareFunction<TTreeData> => {
    let { name = '', parent } = where;
    name = name.toLowerCase();
    return (set: TTreeData[]) => {
        // console.log('applyWhere =>', where, limits);
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
