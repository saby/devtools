import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";

const findInPath = (partOfPath: string, files: IFile[]): IFile | void => {
    const _partOfPath = partOfPath.replace('.min.', '.');
    for ( const file of files ) {
        if (file.path.replace('.min.', '.').includes(_partOfPath)) {
            return file;
        }
    }
};

export default findInPath;
