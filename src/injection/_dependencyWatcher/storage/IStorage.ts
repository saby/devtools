export interface Item {
    id: number;
    name: string;
}

export interface IStorage<T extends Item> {
    getItemById(id: number): T | void;
    getItemByName(name: string): T | void;
    
    getItems(): Set<T>;
    getItemsById(id?: number[]): Set<T>;
    getItemsByName(id?: string[]): Set<T>;

    has(item: T): boolean;
    hasId(id: number): boolean;
    hasName(name: string): boolean;

    add(item: T): void;
    remove(item: T): boolean;
}
