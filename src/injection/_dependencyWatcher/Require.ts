import { IRequire, IRequireInitObject } from './require/IRequire';
import { proxyRequire } from './require/proxy';
import { ModuleStorage } from './storage/Module';
import { ILogger } from 'Extension/Logger/ILogger';
import { IDescriptor } from './IDescriptor';
import { IConfigWithStorage } from './IConfig';

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
      const _this = this;
      const storage = this._storage;
      const logger = this._logger;
      return {
         set(value: IRequire | IRequireInitObject): void {
            if (typeof value === 'function') {
               _this._require = value as IRequire;
               _this._proxy = proxyRequire(_this._require, storage, logger);
            } else {
               _this._init = value;
            }
         },
         get(): IRequire | IRequireInitObject | void {
            return _this._proxy || _this._init;
         }
      };
   }
   getOrigin(): IRequire {
      return this._require;
   }
   getConfig<T extends IRequireInitObject>(): T {
      if (this._require) {
         try {
            // @ts-ignore
            return this._require.s.contexts._.config;
         } catch (error) {
            this._logger.warn(error);
         }
      }
      // @ts-ignore
      return this._init;
   }
}
