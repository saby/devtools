import { SortFunction } from './Sort';
import size from './size';
import name from './name';
import { IFileInfo } from 'Extension/Plugins/DependencyWatcher/IFile';

const filesSort: Record<string, SortFunction<IFileInfo>> = {
   size,
   name
};

export default filesSort;
