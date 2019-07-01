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
        const newFiles = getResourceTiming().filter(({ name }) => {
            return !this.hasName(name);
        }).map<IFile>(({ name, transferSize, decodedBodySize, encodedBodySize }) => {
            return {
                name,
                id: getId(),
                size: transferSize | decodedBodySize,
                modules: new Set<number>()
            }
        });
        newFiles.forEach((file: IFile) => {
            this.add(file);
        });
        return new Set(newFiles);
    }
    find(partOfName: string): IFile | void {
        return findByName(partOfName, this.getItems()) ||
            findByName(partOfName, this.__getNew());
    }
    
}

