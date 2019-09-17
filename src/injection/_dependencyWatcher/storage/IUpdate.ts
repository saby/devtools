import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

export interface IUpdate<TUpdateParams extends IId> {
   hasUpdates(keys: number[]): boolean[];
}

export type UpdateParam<TItem> = IId & Partial<TItem>;
