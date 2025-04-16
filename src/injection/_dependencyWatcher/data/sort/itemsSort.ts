import { SortFunction } from './Sort';
import fileName from './fileName';
import modulesSort from './modulesSort';
import { IRPCModuleInfo } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import filesSort from './filesSort';

const itemsSort: Record<string, SortFunction<IRPCModuleInfo>> = {
   ...modulesSort,
   ...filesSort,
   fileName
};

export default itemsSort;
