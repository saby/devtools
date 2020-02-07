import { Storage } from './Storage';
import { IFile, IFileFilter } from 'Extension/Plugins/DependencyWatcher/IFile';
import { getId } from './getId';
import getNormalizedFileName from './file/getNormalizedFileName';
import getResourcesFromPerformance from './file/getResourcesFromPerformance';
import findInPath from './file/findInPath';
import fileFilters from 'Extension/Plugins/DependencyWatcher/data/filter/fileFilters';
import filesSort from 'Extension/Plugins/DependencyWatcher/data/sort/filesSort';
import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import { Update } from './Update';

/**
 * File storage.
 * A file is a physical file, containing one or more modules.
 * @author Зайцев А.С.
 */
export class FileStorage extends Update<IFile, IFileFilter> {
   private readonly _storage: Storage<IFile, string> = new Storage('path');
   private __getNewFiles(): IFile[] {
      return getResourcesFromPerformance().map(([path, size]) => {
         return this.createOrUpdate(path, size);
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
         findInPath(partOfName, this.__getNewFiles())
      );
   }
   createOrUpdate(path: string, size: number): IFile {
      if (this._storage.hasIndex(path)) {
         const file = this._storage.getItemByIndex(path) as IFile;
         file.size = size;
         this._markUpdated(file.id);
         return file;
      } else {
         const file: IFile = {
            path,
            size,
            name: getNormalizedFileName(path),
            id: getId(),
            modules: new Set<number>()
         };
         this._storage.add(file);
         return file;
      }
   }
   protected _getItems(keys?: number[]): IFile[] {
      return this._storage.getItemsById(keys);
   }
   protected _getFilters(): Partial<
      Record<keyof IFileFilter, FilterFunctionGetter<unknown, IFile>>
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
