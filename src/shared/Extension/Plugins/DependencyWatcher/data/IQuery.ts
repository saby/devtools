export interface Paging {
    limit: number;
    offset: number;
}
export type SortBy<T extends object> = Partial<Record<keyof T, boolean>>;

export interface QueryParam<
    TData extends object,
    TWhere extends object = object,
> extends Paging {
    keys: number[];
    sortBy: SortBy<TData>;
    where: Partial<TWhere>;
}

export interface QueryResult<TData> {
    data: TData[];
    hasMore: boolean;
}
