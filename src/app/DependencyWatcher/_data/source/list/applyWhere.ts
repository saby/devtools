import { IFilterData, ListItem } from "../../types";
import { PrepareFunction } from "../util/PrepareFunction";
import { FilterFunction, FilterFunctionGetter } from "../filter/Filter";
import { getForName } from "../filter/getForName";
import { css } from "../filter/css";
import { json } from "../filter/json";
import { i18n } from "../filter/i18n";

let emptyWrap = <T>(f: FilterFunction<T>): FilterFunctionGetter<T> => {
    return (where) => {
        return f;
    }
};

const ALL_FILTER_GETTER: Record<string, FilterFunctionGetter> = {
    name: getForName,
    css: emptyWrap(css),
    json: emptyWrap(json),
    i18n: emptyWrap(i18n),
};

let getDefaultFilter = <
    T extends ListItem,
    TFilter extends IFilterData
>(where: TFilter): FilterFunction<T>[] => {
    return [
        css,
        json,
        i18n
    ]
};
let getNames = <TFilter extends IFilterData>(where: TFilter) => {
    let keys = Object.keys(where);
    return keys.filter((key) => {
        return ALL_FILTER_GETTER.hasOwnProperty(key);
    });
};
let getFilterFunctions = <
    T extends ListItem,
    TFilter extends IFilterData
>(where: TFilter): FilterFunction<T>[] => {
    let filterNames = getNames(where);
    if (!filterNames.length) {
        return getDefaultFilter(where);
    }
    return filterNames.map((name) => {
        return ALL_FILTER_GETTER[name];
    }).map((getter) => {
        return getter(where);
    });
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
