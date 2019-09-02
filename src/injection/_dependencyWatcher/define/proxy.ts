import { IDefine } from './IDefine';
import { getProxyModules } from './proxyModules';
import { replaceDependencies } from './replaceDependency';
import { ModuleStorage } from '../storage/Module';
import { ILogger } from 'Extension/Logger/ILogger';
import { GLOBAL } from '../../const';

enum warnMessage {
   withoutArgs = 'call without arguments',
   withoutName = 'call without "name"',
   notFunction = 'not function module',
   withOneArg = 'call with one argument'
}

function needReplaceDependencies(
   dependencies: string[],
   replacedModules: string[]
): boolean {
   return dependencies.some((dependency: string) => {
      return replacedModules.includes(dependency);
   });
}

export function proxyDefine(
   define: IDefine,
   storage: ModuleStorage,
   logger: ILogger
): IDefine {
   const proxyModules = getProxyModules(storage, logger);
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
      apply(define: any, _this: any, args: any[]): any {
         if (!args || !args.length) {
            logger.warn(warnMessage.withoutArgs);
            return define.apply(_this, args);
         }
         if (args.length === 1) {
            logger.warn(warnMessage.withOneArg);
            return define.apply(_this, args);
         }
         const name: unknown | string = args[0];
         if (!name || typeof name !== 'string') {
            logger.warn(warnMessage.withoutName);
            return define.apply(_this, args);
         }
         let dependencies: string[];
         let module: Function;
         if (Array.isArray(args[1])) {
            dependencies = args[1];
            module = args[2];
         } else {
            dependencies = [];
            module = args[1];
         }

         _define(name, dependencies, module);

         if (typeof module !== 'function') {
            // logger.warn(`${ warnMessage.notFunction } "${ name }"`);
            return define.apply(_this, args);
         }
         if (!needReplaceDependencies(dependencies, replacedModules)) {
            return define.call(
               _this,
               name,
               dependencies,
               (...depModules: unknown[]) => {
                  _init(name);
                  return module.apply(GLOBAL, depModules);
               }
            );
         }
         return define.call(
            _this,
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
   });
}
