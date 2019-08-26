import { IModule, IModuleFilter, ITransferModule, IModuleInfo } from "./IModule";
import { IFileFilter } from "Extension/Plugins/DependencyWatcher/IFile";
import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

interface IFileInfo {
    fileName: string;
    path: string;
    size: number;
    fileSize: number;
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

export interface IRPCModeuleFilter extends IModuleFilter, IFileFilter {

}

export type UpdateItemParam = IId & Partial<{
    [key in keyof IFileInfo]: IFileInfo[key];
}> & Partial<{
    [key in keyof IModuleInfo]: IModuleInfo[key];
}>
