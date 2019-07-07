import { Id as ModuleId } from "Extension/Plugins/DependencyWatcher/IModule";

export type FileId = number;
export type StackStep = [FileId, ModuleId];
export interface Stack extends Array<StackStep> {}

export interface IFile {
    id: number;
    size: number;
    name: string;
    path: string;
    isBundle?: boolean;
    modules: Set<number>;
    stack: Stack;
}
