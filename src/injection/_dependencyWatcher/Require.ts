import { IRequire, IRequireInitObject } from './require/IRequire';
import { proxyRequire } from './require/proxy';
import { ModuleStorage } from './storage/Module';
import { ILogger } from 'Extension/Logger/ILogger';
import { IDescriptor } from './IDescriptor';
import { IConfigWithStorage } from './IConfig';

/**
 * Wrapper around require which is used to intercept calls to it.
 * @author Зайцев А.С.
 */
export class Require implements IDescriptor {
   private _require: IRequire;
   private _init: IRequireInitObject;
   private _proxy: IRequire;
   private _storage: ModuleStorage;
   private _logger: ILogger;
   constructor({ logger, moduleStorage }: IConfigWithStorage) {
      this._storage = moduleStorage;
      this._logger = logger;
   }
   getDescriptor(): PropertyDescriptor {
      const storage = this._storage;
      const logger = this._logger;
      return {
         set: (value: IRequire | IRequireInitObject): void => {
            /**
             * We use isWasaby field to determine if we should proxy require and define.
             * If require doesn't have it then we just remember the value.
             * If require has this field then we should proxy it.
             * Also, if define was defined before require we have to call its setter again to create proxy.
             */
            if (value && value.isWasaby && typeof value === 'function') {
               this._require = value;
               this._proxy = proxyRequire(this._require, storage, logger);
               if (window.define) {
                  window.define = window.define;
               }
            } else {
               this._init = value;
               try {
                  Object.defineProperty(value, 'isWasaby', {
                     enumerable: false,
                     configurable: true,
                     set: (): void => {
                        this._require = value;
                        this._proxy = proxyRequire(this._require, storage, logger);
                        if (window.define) {
                           window.define = window.define;
                        }
                     },
                     get: (): boolean => {
                        return !!this._require;
                     }
                  });
               } catch (e) {
                  // we don't care about the error, it just shouldn't break things
               }
            }
         },
         get: (): IRequire | IRequireInitObject | void => {
            return this._proxy || this._init;
         },
         configurable: true,
         enumerable: true
      };
   }
   getOrigin(): IRequire {
      return this._require;
   }
   getConfig<T extends IRequireInitObject>(): T {
      if (this._require) {
         try {
            return this._require.s.contexts._.config;
         } catch (error) {
            this._logger.warn(error);
         }
      }
      return this._init;
   }
}
