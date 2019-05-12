import { DependencyType } from './const'

export type IModuleDependency = Record<DependencyType, string[]>;

export type IModulesDependencyMap = Map<string, IModuleDependency>



export type Dependencies = Record<string, Array<string>>;
export type DependenciesRecord = Record<DependencyType, Dependencies>;

export interface IModule {
    name: string;
    dependencies: IModuleDependency;
}

export interface IFile {
    modules: Array<IModule>
    size: number;
    path: string;
}
