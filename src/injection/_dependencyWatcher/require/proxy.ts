import { IRequire } from './IRequire';
import { ModuleStorage } from '../storage/Module';
import { GLOBAL_MODULE_NAME } from 'Extension/Plugins/DependencyWatcher/const';
import { ILogger } from 'Extension/Logger/ILogger';

type RequireArgs = [string | string[]];

function getProxyFunction(
   storage: ModuleStorage,
   logger: ILogger
): (args: RequireArgs) => void {
   return (args: RequireArgs) => {
      try {
         const deps = args[0];
         if (typeof deps === 'string') {
            storage.require(GLOBAL_MODULE_NAME, [deps]);
         } else if (Array.isArray(deps)) {
            storage.require(GLOBAL_MODULE_NAME, deps);
         }
      } catch (error) {
         logger.error(error);
      }
   };
}

/**
 * Creates a proxy around require.
 * @author Зайцев А.С.
 */
export function proxyRequire(
   require: IRequire,
   storage: ModuleStorage,
   logger: ILogger
): IRequire {
   const proxyFunction = getProxyFunction(storage, logger);
   return new Proxy(require, {
      apply(target: IRequire, thisArg: unknown, argArray: RequireArgs): void | object {
         proxyFunction(argArray);
         return target.apply(thisArg, argArray);
      }
   });
}
