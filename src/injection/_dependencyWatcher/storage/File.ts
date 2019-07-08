import { Storage } from "./Storage";
import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";
import { getId } from "./getId";

interface ResourceTiming {
    name: string,
    transferSize: number,
    decodedBodySize: number,
    encodedBodySize: number
}

const getResourceTiming = (): ResourceTiming[] => {
    let resourceTimingList = <PerformanceResourceTiming[]> performance.getEntriesByType('resource');
    return resourceTimingList.filter(({ name }) => {
        return name.includes('/resources/') || name.includes('/cdn/');
    }).map((entry: PerformanceResourceTiming) => {
        return {
            name: entry.name,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize,
            encodedBodySize: entry.encodedBodySize
        };
    });
};

const findInPath = (partOfPath: string, files: Set<IFile>): IFile | void => {
    for ( const file of files ) {
        if (file.path.includes(partOfPath)) {
            return file;
        }
    }
};

const getFileName = (path?: string): string => {
    if (!path) {
        return '';
    }
    return path.
        replace(/\?.+/, ''). // remove query
        replace(/#.+/, ''). // remove hash
        split(/\/|\\/).pop() // get last part of path
        || '';
};

export class FileStorage extends Storage<IFile> {
    private __getNew(): Set<IFile> {
        return new Set(getResourceTiming().filter(({ name }) => {
            return !this.hasName(name);
        }).map<IFile>(({ name, transferSize, decodedBodySize, encodedBodySize }) => {
            return this.create(name, transferSize | decodedBodySize);
        }));
    }
    find(partOfName: string): IFile | void {
        return findInPath(partOfName, this.getItems()) ||
            findInPath(partOfName, this.__getNew());
    }
    create(path: string, size: number, isBundle?: boolean): IFile {
        const file: IFile = {
            path,
            size,
            name: getFileName(path),
            id: getId(),
            modules: new Set<number>(),
            stack: []
        };
        if (typeof isBundle != "undefined") {
            file.isBundle = isBundle;
        }
        this.add(file);
        return file;
    }
}

