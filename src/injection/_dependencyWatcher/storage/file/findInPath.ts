import { IFile } from 'Extension/Plugins/DependencyWatcher/IFile';

/**
 * Tries to find the existing file with the passed name.
 * @author Зайцев А.С.
 */
function findInPath(partOfPath: string, files: IFile[]): IFile | void {
   const _partOfPath = partOfPath.replace('.min.', '.');
   for (const file of files) {
      if (file.path.replace('.min.', '.').includes(_partOfPath)) {
         return file;
      }
   }
}

export default findInPath;
