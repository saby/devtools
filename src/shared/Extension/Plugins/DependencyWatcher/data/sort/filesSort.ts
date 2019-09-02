import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import size from './size';
import name from 'Extension/Plugins/DependencyWatcher/data/sort/name';
import { IFileInfo } from 'Extension/Plugins/DependencyWatcher/IFile';

const filesSort: Record<string, SortFunction<IFileInfo>> = {
   size,
   name
};

export default filesSort;
