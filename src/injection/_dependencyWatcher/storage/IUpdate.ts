import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

export interface IUpdate <TUpdateParams extends IId> {
    updateItems(params: TUpdateParams[]): boolean[];
    hasUpdates(keys: number[]): boolean[];
}

export type UpdateParam<TItem> = IId & Partial<{
    [key in keyof TItem]: TItem[key];
}>
