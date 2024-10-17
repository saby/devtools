interface IItem {
   id: number;
}

/**
 * Wrapper around native Map which adds indexing by indexField.
 * This class doesn't have a remove method by design, because once module is loaded it will never get deleted.
 * @author Зайцев А.С.
 */
export class Storage<TItem extends IItem = IItem, TIndex = unknown> {
   protected _idMap: Map<number, TItem> = new Map();
   protected _indexMap: Map<TIndex, TItem> = new Map();
   constructor(readonly indexField: keyof TItem) {}
   getItemById(id: number): TItem | void {
      return this._idMap.get(id);
   }
   getItemByIndex(index: TIndex): TItem | void {
      return this._indexMap.get(index);
   }

   getItems(): TItem[] {
      return Array.from(this._idMap.values());
   }
   getItemsById(idList?: number[]): TItem[] {
      if (!idList) {
         return this.getItems();
      }
      const set: TItem[] = [];
      idList.forEach((id: number) => {
         const item = this.getItemById(id);
         if (item) {
            set.push(item);
         }
      });
      return set;
   }

   hasIndex(index: TIndex): boolean {
      return this._indexMap.has(index);
   }

   add(item: TItem): void {
      this._idMap.set(item.id, item);
      this._indexMap.set(
         item[this.indexField],
         item
      );
   }
}
