import { PrepareFunction } from "./PrepareFunction";

export let applyPaging = <TTreeData>(offset: number = 0, limits: number): PrepareFunction<TTreeData> => {
    return (set: TTreeData[]) => {
        console.log('applyPaging =>', offset, limits);
        return set.slice(offset, limits?
            limits + offset:
            set.length
        );
    }
};
