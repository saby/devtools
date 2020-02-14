import { DefineArgs, IDefine } from './IDefine';
import { getProxyModules } from './getProxyModules';
import { replaceDependencies } from './replaceDependency';
import { ModuleStorage } from '../storage/Module';
import { GLOBAL } from '../../const';

const MODULE_INDEX = 2;

function needReplaceDependencies(
   dependencies: string[],
   replacedModules: string[]
): boolean {
   return dependencies.some((dependency) => {
      return replacedModules.includes(dependency);
   });
}

/**
 * Creates a proxy around define.
 * @author Зайцев А.С.
 */
export function proxyDefine(
   define: IDefine,
   storage: ModuleStorage
): IDefine {
   const proxyModules = getProxyModules(storage);
   const replacedModules: string[] = Object.keys(proxyModules);
   const _define = (name: string, dependencies: string[], module: unknown) => {
      setTimeout(() => {
         storage.define(name, dependencies, module);
      }, 0);
   };
   const _init = (name: string) => {
      setTimeout(() => {
         storage.initModule(name);
      }, 0);
   };
   return new Proxy(define, {
      apply(target: IDefine, thisArg: unknown, argArray?: DefineArgs): unknown {
         if (!argArray || !argArray.length) {
            // without args
            return target.apply(thisArg, argArray);
         }
         if (argArray.length === 1) {
            // with one arg
            return target.apply(thisArg, argArray);
         }
         const name = argArray[0];
         if (!name || typeof name !== 'string') {
            // without name
            return target.apply(thisArg, argArray);
         }
         let dependencies: string[];
         let module: Function;
         if (Array.isArray(argArray[1])) {
            dependencies = argArray[1];
            module = argArray[MODULE_INDEX];
         } else {
            dependencies = [];
            module = argArray[1];
         }

         _define(name, dependencies, module);

         if (typeof module !== 'function') {
            // TODO: сейчас не отслеживается инициализирован ли модуль, если это объект. Можно обёртку над ним сделать
            return target.apply(thisArg, argArray);
         }
         if (needReplaceDependencies(dependencies, replacedModules)) {
            return target.call(
               thisArg,
               name,
               dependencies,
               (...depModules: unknown[]) => {
                  _init(name);
                  const _depModules: unknown[] = replaceDependencies({
                     proxyModules,
                     args: depModules,
                     dependencies,
                     moduleName: name
                  });
                  return module.apply(GLOBAL, _depModules);
               }
            );
         }
         return target.apply(thisArg, [
            name,
            argArray[1],
            ...argArray.slice(MODULE_INDEX),
            (...depModules: unknown[]) => {
               _init(name);
               return module.apply(GLOBAL, depModules);
            }
         ]);
      }
   });
}
