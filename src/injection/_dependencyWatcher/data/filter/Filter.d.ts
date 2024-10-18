export type FilterFunction<T = unknown> = (item: T) => boolean;

export type FilterFunctionGetter<
    TFilterData,
    TItem,
> = (filter: TFilterData) => FilterFunction<TItem>;
