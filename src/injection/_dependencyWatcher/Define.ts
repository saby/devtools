import { IConfigWithStorage } from './IConfig';
import { IDefine } from './define/IDefine';
import { IDescriptor } from './IDescriptor';
import { ModuleStorage } from './storage/Module';
import { ILogger } from 'Extension/Logger/ILogger';
import { proxyDefine } from './define/proxy';

export class Define implements IDescriptor {
   private _storage: ModuleStorage;
   private _logger: ILogger;
   private _define: IDefine;
   private _proxy: IDefine;
   constructor({ logger, moduleStorage }: IConfigWithStorage) {
      this._storage = moduleStorage;
      this._logger = logger;
   }
   getDescriptor(): PropertyDescriptor {
      const _this = this;
      return {
         set(value: IDefine): void {
            if (!_this._define) {
               _this._define = value;
               _this._proxy = proxyDefine(
                  _this._define,
                  _this._storage,
                  _this._logger
               );
            } else {
               _this._proxy = value;
            }
         },
         get(): IDefine | void {
            return _this._proxy;
         }
      };
   }
}
