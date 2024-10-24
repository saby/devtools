import { Storage } from './Storage';
import { IFile, IFileFilter } from 'Extension/Plugins/DependencyWatcher/IFile';
import { getId } from './getId';
import getNormalizedFileName from './file/getNormalizedFileName';
import getResourcesFromPerformance, {
   init as initPerformanceObserving
} from './file/getResourcesFromPerformance';
import findInPath from './file/findInPath';
import fileFilters from '../data/filter/fileFilters';
import filesSort from '../data/sort/filesSort';
import { FilterFunctionGetter } from '../data/filter/Filter';
import { SortFunction } from '../data/sort/Sort';
import { Query } from './Query';

/**
 * File storage.
 * A file is a physical file, containing one or more modules.
 * @author Зайцев А.С.
 */
export class FileStorage extends Query<IFile, IFileFilter> {
   private readonly _storage: Storage<IFile, string> = new Storage('path');
   constructor() {
      super();
      initPerformanceObserving();
   }
   private __getNewFiles(): IFile[] {
      return getResourcesFromPerformance().map((path) => {
         return this.create(path);
      });
   }
   getItems(keys?: number[]): IFile[] {
      return this._getItems(keys);
   }
   getItem(key: number): IFile | void {
      return this._storage.getItemById(key);
   }
   find(partOfName: string): IFile | void {
      return (
         findInPath(partOfName, this._storage.getItems()) ||
         findInPath(partOfName, this.__getNewFiles())
      );
   }
   create(path: string): IFile {
      const file: IFile = {
         path,
         name: getNormalizedFileName(path),
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
      Record<keyof IFileFilter, FilterFunctionGetter<unknown, IFile>>
   > {
      return fileFilters;
   }
   protected _getSorting(): Record<keyof IFile, SortFunction<IFile>> {
      return filesSort;
   }
}
