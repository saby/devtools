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
    initiator?: number;
    fileId?: number;
}

interface ModuleData<TCollection> extends ModuleInfo, ModuleId, ModuleDependencies<TCollection> {
    initTime: number;
}

interface Module extends ModuleData<Set<Module>> {

}

export interface TransferModule extends ModuleData<Array<number>> {
}

export interface ModulesMap<TModule extends ModuleInfo = Module> extends Map<string, TModule> {

}

export interface ModulesRecord<TModule extends ModuleInfo = Module> extends Record<string, TModule>{

}
