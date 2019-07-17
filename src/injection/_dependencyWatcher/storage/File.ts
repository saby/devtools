import { Storage } from "./Storage";
import { IFile, IFileFilter, IFileInfo } from "Extension/Plugins/DependencyWatcher/IFile";
import { getId } from "./getId";
import getFileName from "./file/getFileName";
import getResourceFromPerformance from "./file/getResourceFromPerformance";
import findInPath from "./file/findInPath";
import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import applyWhere from "Extension/Plugins/DependencyWatcher/data/applyWhere";
import fileFilters from "Extension/Plugins/DependencyWatcher/data/filter/fileFilters";
import applySort from "Extension/Plugins/DependencyWatcher/data/applySort";
import { applyPaging } from "Extension/Plugins/DependencyWatcher/data/applyPaging";
import filesSort from "Extension/Plugins/DependencyWatcher/data/sort/filesSort";

export class FileStorage {
    private readonly __storage: Storage<IFile, string> = new Storage('path');
    private __getNew(): IFile[] {
        return getResourceFromPerformance().filter(({ path }) => {
            return !this.__storage.hasIndex(path);
        }).map<IFile>(({ path, transferSize, decodedBodySize, encodedBodySize }) => {
            return this.create(path, transferSize | decodedBodySize);
        });
    }
    getItems(keys?: number[]): IFile[] {
        return this.__storage.getItemsById(keys);
    }
    getItem(key: number): IFile | void {
        return this.__storage.getItemById(key);
    }
    find(partOfName: string): IFile | void {
        return findInPath(partOfName, this.__storage.getItems()) ||
            findInPath(partOfName, this.__getNew());
    }
    create(path: string, size: number): IFile {
        const file: IFile = {
            path,
            size,
            name: getFileName(path),
            id: getId(),
            modules: new Set<number>(),
            // stack: []
        };
        this.__storage.add(file);
        return file;
    }
    query({
        limit,
        keys,
        offset,
        sortBy,
        where
    }: QueryParam<IFileInfo, IFileFilter>): QueryResult<number> {
        let files = this.getItems(keys);
        const filteredFiles = applyWhere(files, where, fileFilters);
        const sortedItems = <IFile[]> applySort(filteredFiles, sortBy, filesSort);
        const resultKeys: number[] = sortedItems.map(({ id }: IFile) => id);
        return applyPaging<number>(resultKeys, offset, limit);
    }
}

