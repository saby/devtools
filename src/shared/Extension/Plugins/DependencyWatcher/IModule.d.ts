import { DependencyType } from './const';
import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

interface IDependencies<TCollection>
   extends Record<DependencyType, TCollection> {}

interface IModuleDependencies<TCollection> {
   dependencies: IDependencies<TCollection>;
   dependent: IDependencies<TCollection>;
}

/**
 * @interface ModuleInfo
 * @property {String} name Имя модуля
 * @property {Number} fileId Идентификатор файла
 * @property {Boolean} defined Был ли объявлен define модуля (По нему мы понимаем что модульзагружен)
 * @property {Boolean} initialized Был ли модуль инициализирован (Для понимания что модуль испольуется или был втянут в бандле просто так)
 * @property {Boolean} isDeprecated Determines whether a module is deprecated.
 */
export interface IModuleInfo {
   name: string;
   fileId: number;
   defined: boolean;
   initialized: boolean;
   isDeprecated: boolean;
}

interface IModuleData<TCollection>
   extends IModuleInfo,
      IId,
      IModuleDependencies<TCollection> {}

interface IModule extends IModuleData<Set<IModule>> {
   data?: unknown;
}

/**
 * @interface ITransferModule
 * Сериализуемый интерфейс модуля, который мы можем гонять через сообщения по разным контекстам.
 * В отличии от оригинального зависимости/зависимые в нём не являются набором прямых ссылок друг на друга,
 * а представлены в виде массива идентификаторов
 * И нету самого содержание модуля
 */
export interface ITransferModule extends IModuleData<number[]> {}

export interface IModuleFilter {
   css: boolean;
   json: boolean;
   i18n: boolean;
   name: string;
   files: number[];
   dependentOnFiles: number[];
   onlyDeprecated: boolean;
}
