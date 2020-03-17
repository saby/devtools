import { adapter, Model } from 'Types/entity';

export interface ICompatibilityConfig {
   idProperty: string;
   parentProperty?: string;
}

const ERROR_TEXT = 'Not implemented';

/**
 * Compatibility layer for sources of the "Dependencies" tab. Basically, implementation of the Types/_source/ICrud interface.
 * @author Зайцев А.С.
 */
export class Compatibility {
   readonly '[Types/_source/ICrud]': boolean = true;
   protected _keyProperty: string;
   private _opt: unknown;
   protected _adapter: adapter.IAdapter = new adapter.Json();
   constructor({ idProperty }: ICompatibilityConfig) {
      this._keyProperty = idProperty;
   }
   setOptions(opt: unknown): void {
      this._opt = opt;
   }
   getOptions(): unknown {
      return this._opt || {};
   }
   getKeyProperty(): string {
      return this._keyProperty;
   }
   getAdapter(): adapter.IAdapter {
      return this._adapter;
   }
   getModel(): string {
      return 'Types/entity:Model';
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
