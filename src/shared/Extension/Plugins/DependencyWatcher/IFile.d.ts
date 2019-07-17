import { Id as ModuleId } from "Extension/Plugins/DependencyWatcher/IModule";

export type FileId = number;
export type StackStep = [FileId, ModuleId];
export interface Stack extends Array<StackStep> {}

export interface IFileInfo {
    size: number;
    name: string;
    path: string;
}
export interface IFileModules {
    modules: Set<number>;
}
export interface ITransportModules {
    modules: number[];
}

export interface IFileId {
    id: FileId;
}

export interface IFile extends IFileInfo, IFileModules, IFileId {
    // isBundle?: boolean;
    // stack: Stack;
}

export interface ITransportFile extends IFileInfo, ITransportModules {

}

export interface IFileFilter {
    withoutSize: boolean;
    name: string;
}

export type UpdateFileParam = IFileId & {
    // id: number;
    [key in keyof IFileInfo]: IFileInfo[key];
}
