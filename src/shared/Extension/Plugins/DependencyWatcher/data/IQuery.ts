import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

interface IPaging {
   limit: number;
   offset: number;
}
export type SortBy<T extends object> = Partial<Record<keyof T, boolean>>;

export interface IQueryParam<
   TData extends object,
   TWhere extends object = object
> extends IPaging {
   keys?: number[];
   sortBy: SortBy<TData>;
   where: Partial<TWhere>;
}

export interface IQueryResult<TData> {
   data: TData[];
   hasMore: boolean;
}

export interface IQuery<TItem extends IId, TFilter extends object> {
   query(params: Partial<IQueryParam<TItem, TFilter>>): IQueryResult<number>;
}
