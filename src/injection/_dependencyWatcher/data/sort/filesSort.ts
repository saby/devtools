import { SortFunction } from './Sort';
import name from './name';
import { IFileInfo } from 'Extension/Plugins/DependencyWatcher/IFile';

const filesSort: Record<string, SortFunction<IFileInfo>> = {
   name
};

export default filesSort;
