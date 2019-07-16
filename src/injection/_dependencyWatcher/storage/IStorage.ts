export interface Item {
    id: number;
}

export interface IStorage<TItem extends Item, TIndex = unknown> {
    readonly indexField: keyof TItem;
    getItemById(id: number): TItem | void;
    getItemByIndex(index: TIndex): TItem | void;

    getItems(): TItem[];
    getItemsById(id?: number[]): TItem[];
    getItemsByIndex(indexList?: TIndex[]): TItem[];

    has(item: TItem): boolean;
    hasId(id: number): boolean;
    hasIndex(index: TIndex): boolean;

    add(item: TItem): void;
    remove(item: TItem): boolean;
}
