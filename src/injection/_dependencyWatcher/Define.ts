import { IConfigWithStorage } from './IConfig';
import { IDefine } from './define/IDefine';
import { IDescriptor } from './IDescriptor';
import { ModuleStorage } from './storage/Module';
import { proxyDefine } from './define/proxy';

/**
 * Wrapper around define which is used to intercept calls to it.
 * @author Зайцев А.С.
 */
export class Define implements IDescriptor {
   private _storage: ModuleStorage;
   private _define: IDefine;
   private _proxy: IDefine;
   constructor({ moduleStorage }: IConfigWithStorage) {
      this._storage = moduleStorage;
   }
   getDescriptor(): PropertyDescriptor {
      return {
         set: (value: IDefine): void => {
            if (!this._define) {
               this._define = value;
               this._proxy = proxyDefine(
                  this._define,
                  this._storage
               );
            } else {
               this._proxy = value;
            }
         },
         get: (): IDefine | void => {
            return this._proxy;
         },
         configurable: true,
         enumerable: true
      };
   }
}
