import { guid } from 'Extension/Utils/guid';
import { IEventEmitter } from 'Extension/Event/IEventEmitter';

interface IConfig {
   channel: IEventEmitter;
}
type Method<TResult = unknown, TArgs = unknown> = (
   args: TArgs
) => Promise<TResult> | TResult;

interface IMessageRequest<T = unknown> {
   methodName: string;
   args: T;
   id: string;
}
interface IMessageResponse<T = unknown> {
   id: string;
   result?: T;
   error?: {
      message?: string;
      code: number;
   };
}

const SEC = 1000;
const SECONDS_IN_DEFAULT_TIMEOUT = 10;
const DEFAULT_TIMEOUT = SECONDS_IN_DEFAULT_TIMEOUT * SEC;

const NOT_FOUND_CODE = 404;
const INTERNAL_SERVER_ERROR_CODE = 500;

interface IExecuteConfig<TArgs> {
   timeout?: number;
   methodName: string;
   args?: TArgs;
}

interface IWaitingRequest {
   methodName: string;
   resolve(result: unknown): void;
}
interface IRPCError extends Error {
   methodName: string;
   code: number;
}

function getDefaultMessage(method: string, code: number): string {
   return `RPC call method "${method}" error[${code}]`;
}

const requestEvent = 'data-request';
const responseEvent = 'data-response';

/**
 * RPC источник данных, работающий поверх канала сообщений
 */
export class RPC {
   private _methods: Map<string, Method> = new Map();
   private _channel: IEventEmitter;
   private _waitingRequests: Map<string, IWaitingRequest> = new Map();
   private _waitingTimeout: Map<string, number> = new Map();

   constructor(cfg: IConfig) {
      this._channel = cfg.channel;
      this.__requestHandler = this.__requestHandler.bind(this);
      this.__responseHandler = this.__responseHandler.bind(this);
      this._channel.addListener(requestEvent, this.__requestHandler);
      this._channel.addListener(responseEvent, this.__responseHandler);
   }
   destructor(): void {
      this._channel.removeListener(requestEvent, this.__requestHandler);
      this._channel.removeListener(responseEvent, this.__responseHandler);
   }
   execute<TRes, TArg = void>({
      methodName,
      args
   }: IExecuteConfig<TArg>): Promise<TRes> {
      return new Promise<TRes>((resolve, reject) => {
         const id: string = guid();
         this._waitingRequests.set(id, { resolve, methodName });
         const timer: number = window.setTimeout(() => {
            reject(new Error('timeout'));
            this._waitingRequests.delete(id);
            this._waitingTimeout.delete(id);
         }, DEFAULT_TIMEOUT);
         this._waitingTimeout.set(id, timer);
         this._channel.dispatch(requestEvent, {
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
         throw new Error(`The method "${methodName}" has a handler.`);
      }
      this._methods.set(methodName, method);
   }
   private __responseHandler({ id, error, result }: IMessageResponse): void {
      const waiting = this._waitingRequests.get(id);
      if (!waiting) {
         return;
      }

      const { resolve, methodName }: IWaitingRequest = waiting;
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
         return this.__responseError(id, NOT_FOUND_CODE);
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
            return this.__responseError(
               id,
               INTERNAL_SERVER_ERROR_CODE,
               message
            );
         }
      );
   }
   private __responseError(id: string, code: number, message?: string): void {
      this._channel.dispatch(responseEvent, {
         id,
         error: {
            message,
            code
         }
      });
   }
   private __responseResult(id: string, result: unknown): void {
      this._channel.dispatch(responseEvent, {
         id,
         result
      });
   }
}
