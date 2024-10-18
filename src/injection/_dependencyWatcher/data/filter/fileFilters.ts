import { FilterFunctionGetter } from './Filter';
import { getForName } from './getForName';
import { IFileInfo } from 'Extension/Plugins/DependencyWatcher/IFile';

const fileFilters: Record<string, FilterFunctionGetter<unknown, IFileInfo>> = {
   name: getForName
};

export default fileFilters;
