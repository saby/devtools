import { Storage } from "./Storage";
import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";
import { getId } from "./getId";

interface ResourceTiming {
    name: string,
    transferSize: number,
    decodedBodySize: number,
    encodedBodySize: number
}

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
}

