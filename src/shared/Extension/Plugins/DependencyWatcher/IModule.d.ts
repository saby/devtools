import { DependencyType } from './const'

export type IModuleDependency = Record<DependencyType, string[]>;

export type IModulesDependencyMap = Map<string, IModuleDependency>

export type Dependencies = Record<string, Array<string>>;
export type DependenciesRecord = Record<DependencyType, Dependencies>;

interface IFileInfo {
    size: number;
    path: string;
}
export interface IFile extends IFileInfo {
    module: string;
}
export interface Bundle extends IFileInfo {
    modules: string[]
}

// Module
interface IDependencies <TCollection> extends Record<DependencyType, TCollection> {

}

export interface ModuleDependencies<TCollection> {
    dependencies: IDependencies<TCollection>;
    dependent: IDependencies<TCollection>;
}

export interface ModuleInfo {
    id: number;
    name: string
    size?: number;
    fileName?: string;
    bundle?: string;
}

interface Module extends ModuleDependencies<Set<Module>>, ModuleInfo {

}

export interface TransferModule extends ModuleDependencies<Array<number>>, ModuleInfo {
}

export interface ModulesMap<TModule extends ModuleInfo = Module> extends Map<string, TModule> {

}

export interface ModulesRecord<TModule extends ModuleInfo = Module> extends Record<string, TModule>{

}
