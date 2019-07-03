import { ListItem } from "../../types";

export type FilterFunction<T extends ListItem = ListItem> = (item: T) => boolean;

export type FilterFunctionGetter<
    TFilterData,
    TItem extends ListItem = ListItem,
> = (filter: TFilterData) => FilterFunction<TItem>;
