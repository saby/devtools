import { IRequire } from './IRequire';
import { ModuleStorage } from '../storage/Module';
import { GLOBAL_MODULE_NAME } from 'Extension/Plugins/DependencyWatcher/const';
import { ILogger } from 'Extension/Logger/ILogger';

function addDepsFunction(
   storage: ModuleStorage,
   logger: ILogger
): (args: [string | string[] | object, string[]]) => void {
   return (args: [string | string[] | object, string[]]) => {
      try {
         const deps = args[0];
         if (typeof deps === 'string') {
            storage.require(GLOBAL_MODULE_NAME, [deps]);
         } else if (Array.isArray(deps)) {
            storage.require(GLOBAL_MODULE_NAME, deps);
         } else if (typeof deps === 'object' && Array.isArray(args[1])) {
            storage.require(GLOBAL_MODULE_NAME, args[1]);
         }
      } catch (error) {
         logger.error(error);
      }
   };
}

export function proxyRequire(
   require: IRequire,
   storage: ModuleStorage,
   logger: ILogger
): IRequire {
   const addDeps = addDepsFunction(storage, logger);
   return new Proxy(require, {
      apply(target: IRequire, thisArg: any, argArray: any[]): any {
         addDeps(argArray);
         return target.apply(thisArg, argArray);
      }
   });
}
