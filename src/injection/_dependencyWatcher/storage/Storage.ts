import { IStorage, Item } from "./IStorage";

export class Storage<TItem extends Item = Item> implements IStorage<TItem> {
    protected _idMap: Map<number, TItem> = new Map();
    protected _nameMap: Map<string, TItem> = new Map();
    protected _allItems: Set<TItem> = new Set();
    getItemById(id: number): TItem | void  {
        return this._idMap.get(id);
    }
    getItemByName(name: string): TItem | void  {
        return this._nameMap.get(name);
    }

    getItems(): Set<TItem> {
        return this._allItems;
    }
    getItemsById(idList?: number[]): Set<TItem> {
        if (!idList) {
            return this.getItems();
        }
        const set = new Set<TItem>();
        idList.forEach((id: number) => {
            let item = this.getItemById(id);
            if (item) {
                set.add(item);
            }
        });
        return set;
    }
    getItemsByName(nameList?: string[]): Set<TItem> {
        if (!nameList) {
            return this.getItems();
        }
        return new Set([...this._allItems].filter(({ name }) => {
            return nameList.includes(name);
        }));
    }
    
    has(item: TItem): boolean {
        return this._allItems.has(item);
    }
    hasId(id: number): boolean {
        return this._idMap.has(id);
    }
    hasName(name: string): boolean {
        return this._nameMap.has(name);
    }

    add(item: TItem): void {
        this._allItems.add(item);
        this._idMap.set(item.id, item);
        this._nameMap.set(item.name, item);
    }
    remove(item: TItem): boolean {
        if (!this._allItems.delete(item)) {
            return false;
        }
        this._idMap.delete(item.id);
        this._nameMap.delete(item.name);
        return true;
    }
}
