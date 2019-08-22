import { DependencyType } from './const'
import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

export type Dependencies = Record<string, Array<string>>;

interface IDependencies <TCollection> extends Record<DependencyType, TCollection> {

}

export interface ModuleDependencies<TCollection> {
    dependencies: IDependencies<TCollection>;
    dependent: IDependencies<TCollection>;
}

/**
 * @interface ModuleInfo
 * @property {String} name Имя модуля
 * @property {Number} fileId Идентификатор файла
 * @property {Boolean} defined Был ли объявлен define модуля (По нему мы понимаем что модульзагружен)
 * @property {Boolean} initialized Был ли модуль инициализирован (Для понимания что модуль испольуется или был втянут в бандле просто так)
 * @property {Number} [size] Размер модуля (вручную посчитанный размер, может не соответствовать размеру файла)
 */
export interface IModuleInfo {
    name: string
    fileId: number;
    defined: boolean;
    initialized: boolean;
    // size?: number;
}

interface ModuleData<TCollection> extends IModuleInfo, IId, ModuleDependencies<TCollection> {

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
