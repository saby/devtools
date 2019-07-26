import { IModule, IModuleFilter, ITransferModule, ModuleId, ModuleInfo } from "./IModule";
import { IFileFilter } from "Extension/Plugins/DependencyWatcher/IFile";

interface IFileInfo {
    fileName: string;
    path: string;
    size: number;
}

export interface IItemInfo extends IFileInfo, ModuleInfo {
    fileId: number;
}

export interface IItem extends IItemInfo, IModule {
    fileId: number;
}

export interface ITransferItem extends IItemInfo, ITransferModule {
    fileId: number;
}

export interface IItemFilter extends IModuleFilter, IFileFilter {
    dependentOnFile: number[];
}

export type UpdateItemParam = ModuleId & Partial<{
    [key in keyof IFileInfo]: IFileInfo[key];
}>
