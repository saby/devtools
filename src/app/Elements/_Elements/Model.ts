import Store from '../_store/Store';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { IOptions as BreadcrumbsOptions } from '../_Breadcrumbs/Breadcrumbs';
import { getArrayDifference } from 'Controls/Utils/ArraySimpleValuesUtil';

interface IModelItem {
   id: IFrontendControlNode['id'];
   name: string;
   depth: number;
   class: string;
   isExpanded: boolean;
   hasChildren: boolean;
   parentId?: IFrontendControlNode['parentId'];
   logicParentId?: IFrontendControlNode['logicParentId'];
}

/**
 * Model for the elements tab.
 * @author Зайцев А.С.
 */
class Model {
   private _items: Store['_elements'] = [];
   private _visibleItems: Map<
      IFrontendControlNode['id'],
      IModelItem
   > = new Map();
   private _visibleItemsArray: IModelItem[] = [];
   private _expandedItems: Set<IFrontendControlNode['id']> = new Set();
   private _version: number = 0;
   private _itemsChanged: boolean = false;
   private _itemsReordered: boolean = false;

   setItems(items: Model['_items']): void {
      if (this._itemsReordered) {
         this._itemsReordered = false;
         this._itemsChanged = true;
         this._items = items.slice();
         this.__nextVersion();
      }
      const diff = getArrayDifference(this._items, items);
      if (diff.added.length > 0 || diff.removed.length > 0) {
         this._items = items.slice();
         this.__nextVersion();
         this._itemsChanged = true;
         if (this._visibleItems.size) {
            diff.added.forEach((item: IModelItem) => {
               if (item.depth === 0) {
                  this._visibleItems.set(item.id, this.__getElement(item));
               } else if (
                  typeof item.parentId !== 'undefined' &&
                  this._visibleItems.has(item.parentId)
               ) {
                  if (
                     !(this._visibleItems.get(item.parentId) as IModelItem)
                        .hasChildren
                  ) {
                     this.__updateElement(item.parentId, {
                        hasChildren: true
                     });
                  }
                  if (this._expandedItems.has(item.parentId)) {
                     this._visibleItems.set(item.id, this.__getElement(item));
                  }
               }
            });
            diff.removed.forEach((item: IModelItem) => {
               this._visibleItems.delete(item.id);
               this._expandedItems.delete(item.id);
            });
         } else if (this._items.length > 0) {
            const roots = this._items.filter((element) => element.depth === 0);
            roots.forEach((element) =>
               this._visibleItems.set(element.id, this.__getElement(element))
            );
         } else {
            this._visibleItems.clear();
            this._expandedItems.clear();
         }
      }
   }

   onOrderChanged(): void {
      this._itemsReordered = true;
   }

   toggleExpanded(
      key: IFrontendControlNode['id'],
      newStatus: boolean = !this._expandedItems.has(key)
   ): void {
      if (this._expandedItems.has(key) === newStatus) {
         return;
      }
      if (newStatus) {
         this._expandedItems.add(key);
         this.__updateElement(key, {
            isExpanded: true
         });
         this.__getImmediateChildren(key).forEach((child) => {
            this._visibleItems.set(child.id, this.__getElement(child));
         });
         this.getPath(key).forEach((pathItem) => {
            if (pathItem.id !== key) {
               if (this._expandedItems.has(pathItem.id)) {
                  return;
               }
               this._expandedItems.add(pathItem.id);
               this.__updateElement(pathItem.id, {
                  isExpanded: true
               });
               this.__getImmediateChildren(pathItem.id).forEach((child) => {
                  this._visibleItems.set(child.id, this.__getElement(child));
               });
            }
         });
      } else {
         this._expandedItems.delete(key);
         this.__updateElement(key, {
            isExpanded: false
         });
         this.__getChildren(key).forEach((child) => {
            this._expandedItems.delete(child.id);
            this._visibleItems.delete(child.id);
         });
      }
      this.__nextVersion();
      this._itemsChanged = true;
   }

   toggleExpandedRecursive(
      key: IFrontendControlNode['id'],
      newStatus: boolean = !this._expandedItems.has(key)
   ): void {
      if (newStatus) {
         this._expandedItems.add(key);
         this.__updateElement(key, {
            isExpanded: true
         });

         const startIndex = this._items.findIndex(({ id }) => id === key);
         const rootItemDepth = this._items[startIndex].depth;

         for (let i = startIndex + 1; i < this._items.length; i++) {
            const item = this._items[i];
            // Children are always stored immediately after their parents.
            // We use this fact to avoid traversing the whole array.
            if (item.depth <= rootItemDepth) {
               break;
            }
            this._expandedItems.add(item.id);
            this.__updateElement(item.id, {
               isExpanded: true
            });
         }

         this.__nextVersion();
         this._itemsChanged = true;
      } else {
         this.toggleExpanded(key, false);
      }
   }

   getPath(id: IFrontendControlNode['id']): BreadcrumbsOptions['items'] {
      const index = this._items.findIndex((node) => node.id === id);
      if (index !== -1) {
         const node = this._items[index];
         const path = [node];
         let currentDepth = node.depth;
         for (let i = index; i >= 0; i--) {
            if (this._items[i].depth < currentDepth) {
               currentDepth--;
               path.push(this._items[i]);
            }
         }
         return path
            .map((crumb) => {
               return {
                  id: crumb.id,
                  name: crumb.name,
                  class: crumb.class
               };
            })
            .reverse();
      }
      throw new Error('Trying to find nonexistent item');
   }

   getVisibleItems(): IModelItem[] {
      if (this._itemsChanged) {
         this._itemsChanged = false;
         this._visibleItemsArray = this.__visibleItemsToArray();
      }
      return this._visibleItemsArray;
   }

   expandParents(id: IFrontendControlNode['id']): void {
      const item = this._items.find((element) => element.id === id);
      if (item && typeof item.parentId !== 'undefined') {
         const parent = this._items.find(
            (element) => element.id === item.parentId
         );
         if (parent) {
            this.toggleExpanded(parent.id, true);
         }
      }
   }

   isVisible(id: IFrontendControlNode['id']): boolean {
      return this._visibleItems.has(id);
   }

   destructor(): void {
      this._items = [];
      this._visibleItems.clear();
      this._expandedItems.clear();
   }

   private __nextVersion(): void {
      this._version++;
   }

   private __getChildren(
      parentId: IFrontendControlNode['parentId']
   ): IModelItem[] {
      const parents = new Set();
      parents.add(parentId);
      const result: IModelItem[] = [];

      this._items.forEach((element) => {
         if (
            typeof element.parentId !== 'undefined' &&
            parents.has(element.parentId)
         ) {
            parents.add(element.id);
            result.push(this.__getElement(element));
         }
      });

      return result;
   }

   private __getImmediateChildren(
      parentId: IFrontendControlNode['parentId']
   ): Store['_elements'] {
      return this._items.filter((element) => element.parentId === parentId);
   }

   private __getElement(originalElement: IFrontendControlNode): IModelItem {
      if (this._visibleItems.has(originalElement.id)) {
         return this._visibleItems.get(originalElement.id) as IModelItem;
      } else {
         return {
            id: originalElement.id,
            name: originalElement.name,
            depth: originalElement.depth,
            class: originalElement.class,
            parentId: originalElement.parentId,
            logicParentId: originalElement.logicParentId,
            isExpanded: this._expandedItems.has(originalElement.id),
            hasChildren:
               this.__getImmediateChildren(originalElement.id).length > 0
         };
      }
   }

   private __updateElement<K extends keyof IModelItem>(
      key: IModelItem['id'],
      newState: Record<K, IModelItem[K]>
   ): IModelItem {
      const oldItem =
         this._visibleItems.get(key) ||
         this.__getElement(
            this._items.find(
               (element) => element.id === key
            ) as IFrontendControlNode
         );
      const newItem = {
         ...oldItem,
         ...newState
      };
      this._visibleItems.set(key, newItem);
      return newItem;
   }

   private __visibleItemsToArray(): IModelItem[] {
      return this._items
         .filter((element) => this._visibleItems.has(element.id))
         .map((element) => this._visibleItems.get(element.id) as IModelItem);
   }
}

export default Model;
