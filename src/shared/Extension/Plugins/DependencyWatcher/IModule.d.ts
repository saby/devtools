import { DependencyType } from './const'

export type Dependencies = Record<string, Array<string>>;

interface IDependencies <TCollection> extends Record<DependencyType, TCollection> {

}

export interface ModuleDependencies<TCollection> {
    dependencies: IDependencies<TCollection>;
    dependent: IDependencies<TCollection>;
}
export type Id = number;
export interface ModuleId {
    id: Id;
}

export interface ModuleInfo {
    name: string
    fileId: number;
    defined: boolean;
    initialized: boolean;
}

interface ModuleData<TCollection> extends ModuleInfo, ModuleId, ModuleDependencies<TCollection> {

}

interface IModule extends ModuleData<Set<IModule>> {
    data?: any;
}

export interface ITransferModule extends ModuleData<Array<number>> {
}

export interface IModuleFilter {
    css: boolean;
    json: boolean;
    i18n: boolean;
    name: string;
    files: number[];
    dependentOnFiles: number[];
}
