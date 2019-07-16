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
export interface IFile extends IFileInfo, IFileModules {
    id: FileId;
    // isBundle?: boolean;
    // stack: Stack;
}
