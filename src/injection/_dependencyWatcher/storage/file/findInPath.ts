import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";

const findInPath = (partOfPath: string, files: IFile[]): IFile | void => {
    for ( const file of files ) {
        if (file.path.includes(partOfPath)) {
            return file;
        }
    }
};

export default findInPath;
