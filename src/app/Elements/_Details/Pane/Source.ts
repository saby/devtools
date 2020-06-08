import { ICrud, Query, DataSet } from 'Types/source';
import { Record as EntityRecord } from 'Types/entity';
import { RecordSet } from 'Types/collection';

interface IOptions {
   idProperty: string;
   parentProperty: string;
   data: Array<{
      value: unknown;
      name: string;
   }>;
}

const SEPARATOR = '---';

/**
 * Source for the details pane. Avoids circular dependencies by generating new elements on the fly.
 * @author Зайцев А.С.
 */
export class Source implements ICrud {
   protected readonly _idProperty: IOptions['idProperty'];
   protected readonly _parentProperty: IOptions['parentProperty'];
   protected _data: Array<{
      value: unknown;
      hasChildren: true | null;
      name: string;
   }>;
   readonly '[Types/_source/ICrud]': boolean = true;
   readonly _mixins: string[] = {
      '[Types/_source/ICrud]': true
   };

   constructor(options: IOptions) {
      this._idProperty = options.idProperty;
      this._parentProperty = options.parentProperty;
      this._data = options.data.map((item) => {
         return {
            ...item,
            hasChildren: hasChildren(item.value)
         };
      });
   }

   create(meta?: object): Promise<EntityRecord> {
      return Promise.resolve(
         new EntityRecord({
            rawData: meta
         })
      );
   }

   read(key: string): Promise<EntityRecord> {
      const rawData = this._data.find((item) => item[this._idProperty] === key);
      return Promise.resolve(
         new EntityRecord({
            rawData
         })
      );
   }

   update(data: EntityRecord | RecordSet): Promise<void> {
      if (data instanceof RecordSet) {
         data.each((item) => {
            this.__updateItem(item);
         });
      } else {
         this.__updateItem(data);
      }
      return Promise.resolve();
   }

   private __updateItem(item: EntityRecord): void {
      const key = item.get(this._idProperty);
      const itemIndex = this._data.findIndex(
         (element) => element[this._idProperty] === key
      );
      const rawData = item.getRawData(true);
      const newItem = {
         ...rawData,
         hasChildren: hasChildren(rawData.value)
      };
      if (itemIndex !== -1) {
         this._data[itemIndex] = newItem;
      } else {
         this._data.push(newItem);
      }
   }

   destroy(keys: string | string[]): Promise<void> {
      if (keys instanceof Array) {
         keys.forEach((key) => {
            this.__deleteItem(key);
         });
      } else {
         this.__deleteItem(keys);
      }
      return Promise.resolve();
   }

   private __deleteItem(key: string): void {
      const itemIndex = this._data.findIndex(
         (item) => item[this._idProperty] === key
      );
      if (itemIndex !== -1) {
         this._data.splice(itemIndex, 1);
      }
   }

   query(query: Query): Promise<DataSet> {
      const filter = query.getWhere();
      let result: Source['_data'];
      if (typeof filter === 'function') {
         result = this._data.filter((item, index) => filter(item, index));
      } else {
         if (filter[this._parentProperty]) {
            if (filter[this._parentProperty] instanceof Array) {
               result = [];
               filter[this._parentProperty].forEach((key) => {
                  if (key === null) {
                     result = this._data;
                  } else {
                     result = result.concat(this.__getImmediateChildren(key));
                  }
               });
            } else {
               result = this.__getImmediateChildren(
                  filter[this._parentProperty]
               );
            }
         } else {
            result = this._data;

            if (filter.name) {
               result = result.filter(
                  (item) =>
                     item.name
                        .toLowerCase()
                        .indexOf(filter.name.toLowerCase()) !== -1
               );
            }
         }
      }
      return Promise.resolve(
         new DataSet({
            rawData: {
               /**
                * We don't really need an item's value to draw it if it's not a primitive,
                * because only text description will be provided for it.
                * But because the list will try to deep clone items using JSON.stringify we can't just leave it,
                * we have to either remove circular references or substitute values with stubs.
                */
               data: result.map(stubValue),
               meta: {
                  more: false
               }
            },
            itemsProperty: 'data',
            metaProperty: 'meta'
         })
      );
   }

   private __getImmediateChildren(parentId: string): Source['_data'] {
      const parent = this._data.find(
         (item) => item[this._idProperty] === parentId
      );
      const result = [];

      if (!parent) {
         throw new Error('Trying to get contents of nonexistent item');
      }

      Object.entries(parent.value).forEach(([key, value]) => {
         const itemId = parentId + SEPARATOR + key;
         const item = this._data.find((element) => {
            return element[this._idProperty] === itemId;
         });

         if (item) {
            result.push(item);
         } else {
            const newItem = {
               [this._idProperty]: itemId,
               [this._parentProperty]: parentId,
               hasChildren: hasChildren(value),
               name: key,
               value
            };
            result.push(newItem);
            this._data.push(newItem);
         }
      });

      return result;
   }
}

function hasChildren(value: unknown): true | null {
   if (
      typeof value === 'object' &&
      value !== null &&
      Object.keys(value).length > 0
   ) {
      return true;
   }
   return null;
}

function stubValue<
   T extends {
      value: unknown;
   }
>(item: T): T {
   const value = item.value;
   if (typeof value === 'object') {
      let newValue: null | undefined[] | Record<number, null>;
      if (value === null) {
         newValue = null;
      } else if (value instanceof Array) {
         /**
          * We have to preserve length in order to provide accurate description.
          * But we don't need values here and this array gets cloned when the item gets converted to Record.
          * So we substitute each value with 1 to speed up the cloning.
          */
         newValue = new Array(value.length).fill(1);
      } else {
         const numberOfKeys = Object.keys(value).length;
         // With objects we care only about emptiness, so one key is enough
         newValue = numberOfKeys === 0 ? {} : { 0: null };
      }
      return {
         ...item,
         value: newValue
      };
   }
   return item;
}
