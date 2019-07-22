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
    fileId?: number;
    defined: boolean;
    initialized: boolean;
}

interface ModuleData<TCollection> extends ModuleInfo, ModuleId, ModuleDependencies<TCollection> {

}

interface IModule extends ModuleData<Set<IModule>> {

}

export interface ITransferModule extends ModuleData<Array<number>> {
}

export interface ModulesMap<TModule extends ModuleInfo = IModule> extends Map<string, TModule> {

}

export interface ModulesRecord<TModule extends ModuleInfo = IModule> extends Record<string, TModule>{

}

export interface IModuleFilter {
    css: boolean;
    json: boolean;
    i18n: boolean;
    name: string;
    file: { id: number, name: string };
}
