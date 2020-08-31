import { IRPCModuleInfo } from 'Extension/Plugins/DependencyWatcher/IRPCModule';

export interface IListItem extends IRPCModuleInfo {
   id: string;
   parent: string | null;
   isDynamic: boolean;
   hasChildren: true | null;
   itemId: number;
}
