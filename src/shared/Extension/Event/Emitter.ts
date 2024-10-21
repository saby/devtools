import { IEventEmitter, IHandler, ISerializable } from './IEventEmitter';

class Emitter implements IEventEmitter {
   private _listeners: Map<string, Set<IHandler<unknown>>> = new Map();
   addListener<T>(event: string, callback: IHandler<T>): this {
      let listeners = this._listeners.get(event);
      if (!listeners) {
         listeners = new Set();
         this._listeners.set(event, listeners);
      }
      listeners.add(callback);
      return this;
   }
   removeListener<T>(event: string, callback: IHandler<T>): this {
      const listeners = this._listeners.get(event);
      if (listeners) {
         listeners.delete(callback);
      }
      return this;
   }
   removeAllListeners(event?: string): this {
      if (!event) {
         this._listeners.clear();
         return this;
      }
      this._listeners.delete(event);
      return this;
   }
   dispatch(event: string, args: ISerializable): boolean {
      const listeners = this._listeners.get(event);

      if (!listeners) {
         return false;
      }

      const debounce = (callback: IHandler) => {
         setTimeout(() => {
            callback.call(this, args);
         });
      };

      listeners.forEach((callback) => {
         debounce(callback);
      });

      return true;
   }
   destructor(): void {
      this.removeAllListeners();
   }
}

export { Emitter };
