import { SortFunction } from 'Extension/Plugins/DependencyWatcher/data/sort/Sort';
import fileName from './fileName';
import modulesSort from 'Extension/Plugins/DependencyWatcher/data/sort/modulesSort';
import { IRPCModuleInfo } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import filesSort from 'Extension/Plugins/DependencyWatcher/data/sort/filesSort';

const itemsSort: Record<string, SortFunction<IRPCModuleInfo>> = {
   ...modulesSort,
   ...filesSort,
   fileName
};

export default itemsSort;
