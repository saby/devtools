import { IRPCModuleInfo } from 'Extension/Plugins/DependencyWatcher/IRPCModule';

export interface IListItem extends IRPCModuleInfo {
   id: string;
   parent: string | null;
   isDynamic?: boolean;
   child: boolean | null;
   itemId: number;
}
