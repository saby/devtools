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

const findByName = (name: string, files: Set<IFile>): IFile | void => {
    for ( const file of files ) {
        if (file.name.includes(name)) {
            return file;
        }
    }
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
        return findByName(partOfName, this.getItems()) ||
            findByName(partOfName, this.__getNew());
    }
    create(name: string, size: number, isBundle?: boolean): IFile {
        const file = {
            name,
            size,
            isBundle,
            id: getId(),
            modules: new Set<number>()
        };
        this.add(file);
        return file;
    }
    
}

