import { Storage } from './Storage';
import { IFile, IFileFilter } from 'Extension/Plugins/DependencyWatcher/IFile';
import { getId } from './getId';
import getFileName from './file/getFileName';
import getResourceFromPerformance from './file/getResourceFromPerformance';
import findInPath from './file/findInPath';
import fileFilters from 'Extension/Plugins/DependencyWatcher/data/filter/fileFilters';
import filesSort from 'Extension/Plugins/DependencyWatcher/data/sort/filesSort';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import { Update } from './Update';

export class FileStorage extends Update<IFile, IFileFilter> {
   private readonly _storage: Storage<IFile, string> = new Storage('path');
   private __getNew(): IFile[] {
      return getResourceFromPerformance()
         .filter(({ path }) => {
            return !this._storage.hasIndex(path);
         })
         .map(({ path, transferSize, decodedBodySize }) => {
            return this.create(path, transferSize | decodedBodySize);
         });
   }
   getItems(keys?: number[]): IFile[] {
      return this._getItems(keys);
   }
   getItem(key: number): IFile | void {
      return this._getItem(key);
   }
   find(partOfName: string): IFile | void {
      return (
         findInPath(partOfName, this._storage.getItems()) ||
         findInPath(partOfName, this.__getNew())
      );
   }
   create(path: string, size: number): IFile {
      const file: IFile = {
         path,
         size,
         name: getFileName(path),
         id: getId(),
         modules: new Set<number>()
      };
      this._storage.add(file);
      return file;
   }
   protected _getItems(keys?: number[]): IFile[] {
      return this._storage.getItemsById(keys);
   }
   protected _getFilters(): Partial<
      Record<keyof IFileFilter, FilterFunctionGetter<any, IFile>>
   > {
      return fileFilters;
   }
   protected _getSorting(): Record<keyof IFile, SortFunction<IFile>> {
      return filesSort;
   }
   protected _getItem(id: number): void | IFile {
      return this._storage.getItemById(id);
   }
}
