import { DependencyType } from './const'

export type Dependencies = Record<string, Array<string>>;

interface IDependencies <TCollection> extends Record<DependencyType, TCollection> {

}

export interface ModuleDependencies<TCollection> {
    dependencies: IDependencies<TCollection>;
    dependent: IDependencies<TCollection>;
}

export interface ModuleId {
    id: number;
}

export interface ModuleInfo {
    name: string
    fileId?: number;
}

interface ModuleData<TCollection> extends ModuleInfo, ModuleId, ModuleDependencies<TCollection> {

}

interface Module extends ModuleData<Set<Module>> {

}

export interface TransferModule extends ModuleData<Array<number>> {
}

export interface ModulesMap<TModule extends ModuleInfo = Module> extends Map<string, TModule> {

}

export interface ModulesRecord<TModule extends ModuleInfo = Module> extends Record<string, TModule>{

}
