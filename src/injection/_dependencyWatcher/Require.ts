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
            if (typeof value === 'function') {
               this._require = value;
               this._proxy = proxyRequire(this._require, storage, logger);
            } else {
               this._init = value;
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
