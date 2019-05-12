import { IEventEmitter, IHandler, ISerializable } from './IEventEmitter';

class Emitter implements IEventEmitter {
   private _listeners: Map<string, Set<IHandler<any>>> = new Map();
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
      if (this._listeners.has(event)) {
         let listeners = <Set<IHandler<T>>> this._listeners.get(event);
         listeners.delete(callback);
      }
      return this;
   }
   removeAllListeners(event?: string): this {
      if (!event) {
         this._listeners.clear();
         return this;
      }
      if (this._listeners.has(event)) {
         let listeners = <Set<IHandler>> this._listeners.get(event);
         listeners.clear();
      }
      return this;
   }
   dispatch(event: string, args: ISerializable): boolean {
      if (!this._listeners.has(event)) {
         return false;
      }
      let listeners = <Set<IHandler>> this._listeners.get(event);
      
      if (!listeners.size) {
         return false;
      }
      
      let debounce = (callback: IHandler) => {
         setTimeout(() => {
            callback.call(this, args);
         });
      };

      listeners.forEach((callback) => {
         debounce(callback);
      });

      return true;
   }
   destructor(){
      this.removeAllListeners();
   }
}

export {
   Emitter
};
