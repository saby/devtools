import {
   IModule,
   IModuleFilter,
   ITransferModule,
   IModuleInfo
} from './IModule';
import { IFileFilter } from 'Extension/Plugins/DependencyWatcher/IFile';

interface IFileInfo {
   fileName: string;
   path: string;
}

export interface IRPCModuleInfo extends IFileInfo, IModuleInfo {
   fileId: number;
}

export interface IRPCModule extends IRPCModuleInfo, IModule {
   fileId: number;
}

export interface ITransferRPCModule extends IRPCModuleInfo, ITransferModule {
   fileId: number;
}

export interface IRPCModuleFilter extends IModuleFilter, IFileFilter {}
