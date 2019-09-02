import { Query } from './Query';
import { IId } from 'Extension/Plugins/DependencyWatcher/interface';
import { IUpdate, UpdateParam } from './IUpdate';
import { merge } from 'Extension/Plugins/DependencyWatcher/util/merge';

export abstract class Update<
   TItem extends IId,
   TFilter extends object,
   TUpdate extends UpdateParam<TItem> = UpdateParam<TItem>
> extends Query<TItem, TFilter> implements IUpdate<TUpdate> {
   private readonly _updates: Set<number> = new Set();
   updateItems(params: TUpdate[]): boolean[] {
      return params.map((param: TUpdate) => {
         const item = this._getItem(param.id);
         if (!item) {
            return false;
         }
         return this._updateItem(item, param);
      });
   }
   hasUpdates(keys: number[]): boolean[] {
      const result: boolean[] = [];
      keys.forEach((key: number) => {
         result.push(this._updates.has(key));
         this._updates.delete(key);
      });
      return result;
   }
   protected _markUpdated(id: number): void {
      this._updates.add(id);
   }
   protected _updateItem(item: TItem, param: TUpdate): boolean {
      this._markUpdated(item.id);
      return merge(item, param);
   }
   protected abstract _getItem(id: number): TItem | void;
}
