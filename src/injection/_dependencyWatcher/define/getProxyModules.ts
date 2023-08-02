import { REQUIRE } from '../const';
import { LocalRequire } from '../require/IRequire';
import { ModuleStorage } from '../storage/Module';

type ReplaceFunction<T extends object> = (name: string, origin: T) => T;

interface IProxyObject {
   require: ReplaceFunction<LocalRequire>;
   'Core/library': ReplaceFunction<object>;
   'Core/moduleStubs': ReplaceFunction<object>;
}

/**
 * Replaces proxies for modules that do dynamic imports (require, Core/library, Core/moduleStubs).
 * @author Зайцев А.С.
 */
export function getProxyModules(storage: ModuleStorage): IProxyObject {
   function proxyRequire(name: string, require: LocalRequire): LocalRequire {
      return new Proxy(require, {
         apply(
            target: LocalRequire,
            thisArg: unknown,
            argArray: Array<string | string[]>
         ): object | void {
            storage.require(name, argArray[0]);
            return target.apply(thisArg, argArray);
         }
      });
   }

   function proxyModuleStubs<T extends object>(
      name: string,
      moduleStubs: T
   ): T {
      return new Proxy(moduleStubs, {
         get(target: T, property: string | number | symbol): unknown {
            if (property === 'requireModule' || property === 'require') {
               return (mods: string | string[]) => {
                  storage.require(name, mods);
                  return target[property].call(target, mods);
               };
            }
            return target[property];
         }
      });
   }

   function proxyLibrary<T extends object>(name: string, library: T): T {
      return new Proxy(library, {
         get(target: T, property: string | number | symbol): unknown {
            if (property === 'load') {
               return (module: string, loader?: unknown) => {
                  storage.require(name, target.parse(module).name);
                  return target[property].call(target, module, loader);
               };
            }
            return target[property];
         }
      });
   }

   return {
      [REQUIRE]: proxyRequire,
      'Core/library': proxyLibrary,
      'Core/moduleStubs': proxyModuleStubs
   };
}
