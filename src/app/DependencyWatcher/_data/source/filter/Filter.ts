import { IFilterData, ListItem } from "../../types";

export type FilterFunction<T extends ListItem = ListItem> = (item: T) => boolean;

export type FilterFunctionGetter<
    TItem extends ListItem = ListItem,
    TFilter extends IFilterData = IFilterData
> = (filter: TFilter) => FilterFunction<TItem>;
