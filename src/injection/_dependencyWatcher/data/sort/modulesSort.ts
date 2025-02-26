import { SortFunction } from './Sort';
import { IModuleInfo } from 'Extension/Plugins/DependencyWatcher/IModule';
import name from './name';
import used from './used';

const modulesSort: Record<string, SortFunction<IModuleInfo>> = {
   name,
   used
};

export default modulesSort;
