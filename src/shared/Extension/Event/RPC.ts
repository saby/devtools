import { guid } from 'Extension/Utils/guid';
import { IEventEmitter } from 'Extension/Event/IEventEmitter';

interface IConfig {
   channel: IEventEmitter;
}
export type Method<TResult = any, TArgs = any> = (
   args: TArgs
) => Promise<TResult> | TResult;

interface IMessageRequest<T = any> {
   methodName: string;
   args: T;
   id: string;
}
interface IMessageResponse<T = any> {
   id: string;
   result?: T;
   error?: {
      message?: string;
      code: number;
   };
}

const SEC = 1000;
const MIN = 60 * SEC;
const DEFAULT_TIMEOUT = 10 * SEC;

interface IExecuteConfig<TArgs> {
   timeout?: number;
   methodName: string;
   args?: TArgs;
}

interface IWaitingRequests {
   methodName: string;
   resolve(result: any): void;
}
interface IRPCError extends Error {
   methodName: string;
   code: number;
}

const getDefaultMessage = (method: string, code: number) => {
   return `RPC call method "${method}" error[${code}]`;
};

/**
 * RPC источник данных, работающий поверх канала сообщений
 */
export class RPC {
   private _methods: Map<string, Method> = new Map();
   private _channel: IEventEmitter;
   private _waitingRequests: Map<string, IWaitingRequests> = new Map();
   private _waitingTimeout: Map<string, number> = new Map();
   private _requestEvent: string = 'data-request';
   private _responseEvent: string = 'data-response';
   private _onResponse: (response: IMessageResponse) => void;
   private _onRequest: (request: IMessageRequest) => void;

   constructor(cfg: IConfig) {
      this._channel = cfg.channel;
      this._onRequest = this.__requestHandler.bind(this);
      this._onResponse = this.__responseHandler.bind(this);
      this._channel.addListener(this._requestEvent, this._onRequest);
      this._channel.addListener(this._responseEvent, this._onResponse);
   }
   destructor(): void {
      this._channel.removeListener(this._requestEvent, this._onRequest);
      this._channel.removeListener(this._responseEvent, this._onResponse);
      delete this._onRequest;
      delete this._onResponse;
   }
   execute<TRes, TArg = void>({
      methodName,
      args,
      timeout = DEFAULT_TIMEOUT
   }: IExecuteConfig<TArg>): Promise<TRes> {
      return new Promise<TRes>((resolve, reject) => {
         const id: string = guid();
         this._waitingRequests.set(id, { resolve, methodName });
         const timer: number = window.setTimeout(() => {
            reject(new Error('timeout'));
            this._waitingRequests.delete(id);
            this._waitingTimeout.delete(id);
         }, timeout);
         this._waitingTimeout.set(id, timer);
         this._channel.dispatch(this._requestEvent, {
            methodName,
            id,
            args
         } as IMessageRequest<TArg>);
      });
   }
   registerMethod<TRes, TArg>(
      methodName: string,
      method: Method<TRes, TArg>
   ): void {
      if (this._methods.has(methodName)) {
         throw new Error(`method "${methodName}"`);
      }
      this._methods.set(methodName, method);
   }
   private __responseHandler({ id, error, result }: IMessageResponse): void {
      const waiting = this._waitingRequests.get(id);
      if (!waiting) {
         return;
      }

      const { resolve, methodName } = waiting;
      this._waitingRequests.delete(id);
      window.clearTimeout(this._waitingTimeout.get(id));
      this._waitingTimeout.delete(id);

      if (!error) {
         resolve(result);
         return;
      }
      const resultError = new Error(
         error.message || getDefaultMessage(methodName, error.code)
      ) as IRPCError;
      resultError.code = error.code;
      resultError.methodName = methodName;
      resolve(Promise.reject(resultError));
   }
   private __requestHandler({ methodName, args, id }: IMessageRequest): void {
      const method = this._methods.get(methodName);

      if (typeof method !== 'function') {
         return this.__responseError(id, 404);
      }
      const resultPromise = method(args);
      if (!(resultPromise instanceof Promise)) {
         return this.__responseResult(id, resultPromise);
      }
      resultPromise.then(
         (result) => {
            return this.__responseResult(id, result);
         },
         (message) => {
            return this.__responseError(id, 500, message);
         }
      );
   }
   private __responseError(id: string, code: number, message?: string): void {
      this._channel.dispatch(this._responseEvent, {
         id,
         error: {
            message,
            code
         }
      } as IMessageResponse);
   }
   private __responseResult(id: string, result: any): void {
      this._channel.dispatch(this._responseEvent, {
         id,
         result
      } as IMessageResponse);
   }
}
