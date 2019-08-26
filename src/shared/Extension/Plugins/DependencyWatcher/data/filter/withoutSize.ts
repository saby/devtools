import { FilterFunction, FilterFunctionGetter } from "./Filter";
interface Size {
    size: number;
}

const filter: FilterFunction<Size> = <T extends Size>(item: T): boolean => {
    return !item.size;
};

const withoutSizeGetter: FilterFunctionGetter<boolean, Size> = <T extends Size>(withoutSize: boolean) => {
    if (withoutSize) {
        return filter;
    }
    return () => true;
};

export default withoutSizeGetter;
