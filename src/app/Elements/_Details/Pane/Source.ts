import { ICrud, Query, DataSet } from 'Types/source';
import { Record as EntityRecord } from 'Types/entity';
import { RecordSet } from 'Types/collection';
import { isEqual } from 'Types/object';
import { hydrate, INSPECTED_ITEM_META } from '../../_utils/hydrate';
import { TEMPLATES } from './const';
import Store from '../../_store/Store';
import { InspectedElementPayload } from 'Types/ElementInspection';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';

interface IOptions {
   data: Record<string, unknown>;
   store: Store;
   controlId: IFrontendControlNode['id'];
   root: string;
}

/**
 * Source for the details pane.
 * @author Зайцев А.С.
 */
export class Source implements ICrud {
   protected _data: IItem[];
   protected _store: IOptions['store'];
   protected _controlId: IOptions['controlId'];
   protected _root: IOptions['root'];
   readonly '[Types/_source/ICrud]': boolean = true;
   readonly _mixins: Record<string, boolean> = {
      '[Types/_source/ICrud]': true
   };

   constructor(options: IOptions) {
      this._data = getRawData(options.data);
      this._store = options.store;
      this._controlId = options.controlId;
      this._root = options.root.toLowerCase();
   }

   create(meta?: object): Promise<EntityRecord> {
      return Promise.resolve(
         new EntityRecord({
            rawData: meta
         })
      );
   }

   read(key: string): Promise<EntityRecord> {
      const rawData = this._data.find((item) => item.key === key);
      return Promise.resolve(
         new EntityRecord({
            rawData
         })
      );
   }

   update(data: EntityRecord | RecordSet | object): Promise<void> {
      if (data instanceof RecordSet) {
         data.each((item) => {
            this.__updateItem(item.getRawData());
         });
      } else if (data instanceof EntityRecord) {
         this.__updateItem(data.getRawData());
      } else {
         const convertedData = getRawData(data);
         convertedData.forEach((item) => {
            this.__updateItem(item);
         });
      }
      return Promise.resolve();
   }

   private __updateItem(item: IItem): void {
      const key = item.key;
      const itemIndex = this._data.findIndex((element) => element.key === key);
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
      const itemIndex = this._data.findIndex((item) => item.key === key);
      if (itemIndex !== -1) {
         this._data.splice(itemIndex, 1);
      }
   }

   query(query: Query): Promise<DataSet> {
      const filter = query.getWhere() as {
         parent?: null | string | string[];
         name?: string;
      };
      if (filter.parent) {
         if (filter.parent instanceof Array) {
            const resultPromises: Array<Promise<Source['_data']>> = [];
            filter.parent.forEach((key) => {
               resultPromises.push(this.__getImmediateChildren(key));
            });
            return Promise.all(resultPromises).then((data) => {
               return new DataSet({
                  rawData: {
                     data: data.reduce((acc, part) => {
                        return acc.concat(part);
                     }, []),
                     meta: {
                        more: false
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               });
            });
         } else {
            return this.__getImmediateChildren(filter.parent).then((data) => {
               return new DataSet({
                  rawData: {
                     data,
                     meta: {
                        more: false
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               });
            });
         }
      } else {
         let result = this._data.filter((item) => item.parent === null);

         if (filter.name) {
            result = result.filter(
               (item) =>
                  item.name
                     .toLowerCase()
                     .indexOf((filter.name as string).toLowerCase()) !== -1
            );
         }

         return Promise.resolve(
            new DataSet({
               rawData: {
                  data: result,
                  meta: {
                     more: false
                  }
               },
               itemsProperty: 'data',
               metaProperty: 'meta'
            })
         );
      }
   }

   private __getImmediateChildren(parentId: string): Promise<Source['_data']> {
      const children = this._data.filter(
         (element) => element.parent === parentId
      );
      if (children.length) {
         return Promise.resolve(children);
      }

      const pathToParent = parentId.split(SEPARATOR).reverse();
      const path = [this._root].concat(pathToParent);

      return new Promise((resolve) => {
         const handler = (payload: InspectedElementPayload) => {
            if (
               payload.type === 'path' &&
               payload.id === this._controlId &&
               isEqual(path, payload.path)
            ) {
               const { value } = payload;
               const hydratedValue = getRawData(
                  hydrate(
                     value.data,
                     value.cleaned.map((cleanedPath) =>
                        cleanedPath.slice(pathToParent.length)
                     )
                  ) as Record<string, unknown>
               );
               hydratedValue.forEach((item) => {
                  item.key = item.key + SEPARATOR + parentId;
                  item.parent = item.parent
                     ? item.parent + SEPARATOR + parentId
                     : parentId;
               });
               this._data = this._data.concat(hydratedValue);

               this._store.removeListener('inspectedElement', handler);
               resolve(hydratedValue);
            }
         };
         this._store.addListener('inspectedElement', handler);
         this._store.dispatch('inspectElement', {
            path,
            id: this._controlId
         });
      });
   }
}

interface IItem {
   key: string;
   caption: unknown;
   name: string;
   parent: string | null;
   hasChildren: true | null;
   template: string;
   hasBreakpoint?: boolean;
}

function getHasChildren(value: unknown): true | null {
   if (typeof value === 'object' && value !== null) {
      if (typeof value[INSPECTED_ITEM_META.expandable] === 'boolean') {
         return value[INSPECTED_ITEM_META.expandable] ? true : null;
      } else if (Object.keys(value).length > 0) {
         return true;
      }
   }
   return null;
}

function getCaption(value: unknown): string {
   if (value?.[INSPECTED_ITEM_META.caption]) {
      return value[INSPECTED_ITEM_META.caption];
   }

   if (typeof value === 'object') {
      if (value instanceof Array) {
         return `Array[${value.length}]`;
      } else if (value === null) {
         return 'null';
      } else {
         return Object.keys(value).length === 0 ? 'Empty object' : 'Object';
      }
   }

   return '' + value;
}

function getTemplate(value: unknown): string {
   const type = value?.[INSPECTED_ITEM_META.type] ?? typeof value;
   if (TEMPLATES.hasOwnProperty(type)) {
      return TEMPLATES[type];
   }
   return TEMPLATES.string;
}

const SEPARATOR = '---';

function addItem(
   result: IItem[],
   key: string,
   value: unknown,
   parent: string | null = null
): void {
   const hasChildren = getHasChildren(value);
   const item: IItem = {
      key: parent ? key + SEPARATOR + parent : key,
      hasChildren,
      parent,
      caption: getCaption(value),
      name: key,
      template: getTemplate(value)
   };

   result.push(item);

   if (item.hasChildren) {
      Object.entries(value as object).forEach(([childKey, childValue]) => {
         addItem(result, childKey, childValue, item.key);
      });
   }
}

function getRawData(initialData: Record<string, unknown>): IItem[] {
   const result: IItem[] = [];

   Object.entries(initialData).forEach(([key, value]: [string, unknown]) => {
      addItem(result, key, value);
   });

   return result;
}
