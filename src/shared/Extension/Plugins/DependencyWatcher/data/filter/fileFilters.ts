import { FilterFunctionGetter } from 'Extension/Plugins/DependencyWatcher/data/filter/Filter';
import { getForName } from 'Extension/Plugins/DependencyWatcher/data/filter/getForName';
import { IFileInfo } from 'Extension/Plugins/DependencyWatcher/IFile';
import withoutSize from 'Extension/Plugins/DependencyWatcher/data/filter/withoutSize';

const fileFilters: Record<string, FilterFunctionGetter<unknown, IFileInfo>> = {
   name: getForName,
   withoutSize
};

export default fileFilters;
