import { IModule, IModuleFilter, ITransferModule, ModuleInfo } from "./IModule";

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

export interface IItemFilter extends IModuleFilter {

}
