import { PrepareFunction } from "./PrepareFunction";

export let applyOrderBy = <TTreeData>(orderBy: unknown[]): PrepareFunction<TTreeData> => {
    return (set: TTreeData[]) => {
        console.log('applyOrderBy =>', orderBy);
        
        return set;
    }
};
