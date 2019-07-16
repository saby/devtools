import { IStorage, Item } from "./IStorage";

export class Storage<TItem extends Item = Item, TIndex = unknown> implements IStorage<TItem, TIndex> {
    protected _idMap: Map<number, TItem> = new Map();
    protected _indexMap: Map<TIndex, TItem> = new Map();
    protected _allItems: Set<TItem> = new Set();
    constructor(public readonly indexField: keyof TItem) {
    
    }
    getItemById(id: number): TItem | void  {
        return this._idMap.get(id);
    }
    getItemByIndex(index: TIndex): TItem | void  {
        return this._indexMap.get(name);
    }

    getItems(): TItem[] {
        return [...this._allItems];
    }
    getItemsById(idList?: number[]): TItem[] {
        if (!idList) {
            return this.getItems();
        }
        const set:TItem[] = [];
        idList.forEach((id: number) => {
            let item = this.getItemById(id);
            if (item) {
                set.push(item);
            }
        });
        return set;
    }
    getItemsByIndex(indexList?: TIndex[]): TItem[] {
        if (!indexList) {
            return this.getItems();
        }
        return [...this._allItems].filter((item: TItem) => {
            return indexList.includes(
                // @ts-ignore
                item[this.indexField]
            );
        });
    }
    
    has(item: TItem): boolean {
        return this._allItems.has(item);
    }
    hasId(id: number): boolean {
        return this._idMap.has(id);
    }
    hasIndex(index: TIndex): boolean {
        return this._indexMap.has(name);
    }

    add(item: TItem): void {
        this._allItems.add(item);
        this._idMap.set(item.id, item);
        this._indexMap.set(
            // @ts-ignore
            item[this.indexField],
            item
        );
    }
    remove(item: TItem): boolean {
        if (!this._allItems.delete(item)) {
            return false;
        }
        this._idMap.delete(item.id);
        this._indexMap.delete(
            // @ts-ignore
            item[this.indexField]
        );
        return true;
    }
}
