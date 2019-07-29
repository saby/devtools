import { IFilterData, ListItem } from "../../types";
import { PrepareFunction } from "../util/PrepareFunction";
import { FilterFunction, FilterFunctionGetter } from "../filter/Filter";
import { getForName } from "../filter/getForName";
import { css } from "../filter/css";
import { json } from "../filter/json";
import { i18n } from "../filter/i18n";

let ignoreWrap = (f: FilterFunction): FilterFunctionGetter<boolean> => {
    return (ignoreFilter: boolean) => {
        if (ignoreFilter) {
            return () => true;
        }
        return f;
    }
};

const ALL_FILTER_GETTER: Record<string, FilterFunctionGetter<any>> = {
    name: <FilterFunctionGetter<string>> getForName,
    css: <FilterFunctionGetter<boolean>> ignoreWrap(css),
    json: <FilterFunctionGetter<boolean>> ignoreWrap(json),
    i18n: <FilterFunctionGetter<boolean>> ignoreWrap(i18n),
};
const DEFAULT_FILTERS: Record<string, boolean> = {
    css:  false,
    json: false,
    i18n: false,
};

let getFilterFunctions = <
    T extends ListItem,
    TFilter extends IFilterData
>(where: TFilter): FilterFunction<T>[] => {
    const _where = {
        ...DEFAULT_FILTERS,
        ...where
    };
    const filterFunctions: FilterFunction[] = [];
    for (const fName in _where) {
        if (ALL_FILTER_GETTER.hasOwnProperty(fName)) {
            filterFunctions.push(ALL_FILTER_GETTER[fName](_where[fName]));
        }
    }
    return filterFunctions;
};


export let applyWhere = <TTreeData extends ListItem, TFilter extends IFilterData> (
    where: TFilter,
    limits: number
): PrepareFunction<TTreeData> => {
    let filterFunctions: FilterFunction[] = getFilterFunctions(where);
    return (set: TTreeData[]) => {
        if (where.parent) {
            return set;
        }
        return set.filter((item: TTreeData) => {
            return filterFunctions.every((filter: FilterFunction) => {
                return filter(item);
            });
        });
    }
};
