import { adapter, Model } from 'Types/entity';

export interface ICompatibilityConfig {
   idProperty: string;
   parentProperty?: string;
}

const ERROR_TEXT = 'Not implemented';

export class Compatibility {
   readonly '[Types/_source/ICrud]': boolean = true;
   protected _idProperty: string;
   private _opt: unknown;
   protected _adapter: adapter.IAdapter = new adapter.Json();
   constructor({ idProperty }: ICompatibilityConfig) {
      this._idProperty = idProperty;
   }
   setOptions(opt: unknown): void {
      this._opt = opt;
   }
   getOptions(): unknown {
      return this._opt || {};
   }
   getIdProperty(): string {
      return this._idProperty;
   }
   getAdapter(): adapter.IAdapter {
      return this._adapter;
   }

   read<TKey extends string, TMeta = unknown>(
      id: TKey,
      meta?: TMeta
   ): Promise<Model> {
      return Promise.reject(new Error(ERROR_TEXT));
   }

   create(): Promise<never> {
      return Promise.reject(new Error(ERROR_TEXT));
   }

   update(): Promise<never> {
      return Promise.reject(new Error(ERROR_TEXT));
   }
   delete(): Promise<never> {
      return Promise.reject(new Error(ERROR_TEXT));
   }
   static '[Types/_source/ICrud]': boolean = true;
}
