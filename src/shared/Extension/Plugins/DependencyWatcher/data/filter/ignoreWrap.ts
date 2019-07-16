import { FilterFunction, FilterFunctionGetter } from "Extension/Plugins/DependencyWatcher/data/filter/Filter";

const ignoreWrap = (f: FilterFunction): FilterFunctionGetter<boolean> => {
    return (ignoreFilter: boolean) => {
        if (ignoreFilter) {
            return () => true;
        }
        return f;
    }
};

export default ignoreWrap;
