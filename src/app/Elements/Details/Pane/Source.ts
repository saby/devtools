import { ICrud, Query, DataSet } from 'Types/source';
import { Record as EntityRecord } from 'Types/entity';
import { RecordSet } from 'Types/collection';

interface IOptions {
   idProperty: string;
   parentProperty: string;
   data: object[];
}

function hasChildren(value: unknown): true | null {
   if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
      return true;
   }
   return null;
}

const SEPARATOR = '---';

export class Source implements ICrud {
   protected readonly _idProperty: IOptions['idProperty'];
   protected readonly _parentProperty: IOptions['parentProperty'];
   protected _data: object[];
   readonly '[Types/_source/ICrud]': boolean = true;
   readonly _mixins: object = {
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
      const rawData = this._data.find(
         (item) => item[this._idProperty] === key
      );
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
      if (itemIndex !== -1) {
         this._data[itemIndex] = item;
      } else {
         this._data.push(item);
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
      let result: object[];
      if (typeof filter === 'function') {
         // TODO: подумать может ли быть у меня такой фильтр вообще
         result = this._data;
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
               result = this.__getImmediateChildren(filter[this._parentProperty]);
            }
         } else {
            result = this._data;
         }
      }
      return Promise.resolve(
         new DataSet({
            rawData: {
               data: result
            },
            itemsProperty: 'data'
         })
      );
   }

   private __getValueByPath(path: string[]): unknown {
      let currentProperty = path.pop();
      let value = this._data.find(
         (item) => item[this._idProperty] === currentProperty
      );
      while (path.length) {
         currentProperty = path.pop();
         if (currentProperty && value) {
            value =
               value instanceof EntityRecord
                  ? value.get(currentProperty)
                  : value[currentProperty];
         }
      }
      return value;
   }

   private __getImmediateChildren(parentId: string): object[] {
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
