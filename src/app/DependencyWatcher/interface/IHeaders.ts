export interface IHeader<TItem extends object> {
    title: string;
    align?: string;
    sortingProperty?: keyof TItem | string;
}

export type IHeaders<TItem extends object> = Array<IHeader<TItem>>
