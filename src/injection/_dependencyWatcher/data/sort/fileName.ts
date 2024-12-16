import { SortFunction, SortResult } from './Sort';
import { IRPCModuleInfo } from 'Extension/Plugins/DependencyWatcher/IRPCModule';

const fileName: SortFunction<IRPCModuleInfo> = <T extends IRPCModuleInfo>(
   firstItem: T,
   secondItem: T
): SortResult => {
   const first: string = firstItem.fileName;
   const second: string = secondItem.fileName;
   return first.localeCompare(second, undefined, { sensitivity: 'base' });
};

export default fileName;
