import { guid } from 'Extension/Utils/guid';
import { IEventEmitter } from "Extension/Event/IEventEmitter";

interface IConfig {
    channel: IEventEmitter
}
export type Method<TResult = any, TArgs = any> = (args: TArgs) => Promise<TResult> | TResult;

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
    timeout?: number
    methodName: string;
    args?: TArgs;
}

/**
 * RPC источник данных, работающий поверх канала сообщений
 */
export class RPC {
    private __methods: Map<string, Method> = new Map();
    private __channel: IEventEmitter;
    private __waitingRequests: Map<string, (result: any) => void > = new Map();
    private __waitingTimeout: Map<string, number> = new Map();
    private __requestEvent = 'data-request';
    private __responseEvent = 'data-response';
    
    constructor(cfg: IConfig) {
        this.__channel = cfg.channel;
        this.__onRequest = this.__requestHandler.bind(this);
        this.__onResponse = this.__responseHandler.bind(this);
        this.__channel.addListener(this.__requestEvent, this.__onRequest);
        this.__channel.addListener(this.__responseEvent, this.__onResponse);
    }
    destructor() {
        this.__channel.removeListener(this.__requestEvent, this.__onRequest);
        this.__channel.removeListener(this.__responseEvent, this.__onResponse);
        delete this.__onRequest;
        delete this.__onResponse;
    }
    execute<TRes, TArg = void>({
       methodName,
       args,
       timeout = DEFAULT_TIMEOUT
    } : IExecuteConfig<TArg>): Promise<TRes> {
        return new Promise<TRes>((resolve, reject) => {
            let id: string = guid();
            this.__waitingRequests.set(id, resolve);
            let timer: number = setTimeout(() => {
                reject(new Error('timeout'));
                this.__waitingRequests.delete(id);
                this.__waitingTimeout.delete(id);
            }, timeout);
            this.__waitingTimeout.set(id,timer);
            this.__channel.dispatch(this. __requestEvent, <IMessageRequest<TArg>> {
                methodName,
                id,
                args
            });
        })
    }
    registerMethod<TRes, TArg>(methodName: string, method: Method<TRes, TArg>): void {
        if (this.__methods.has(methodName)) {
            throw new Error(`method "${ methodName }"`);
        }
        this.__methods.set(methodName, method);
    }
    private __responseHandler({ id, error, result }: IMessageResponse) {
        let resolve = this.__waitingRequests.get(id);
        this.__waitingRequests.delete(id);
        clearTimeout(this.__waitingTimeout.get(id));
        this.__waitingTimeout.delete(id);
        
        if (!resolve) {
            return;
        }
        if (!error) {
            resolve(result);
            return;
        }
        let resultError = new Error(error.message);
        //@ts-ignore
        resultError.code = error.code;
        resolve(Promise.reject(resultError));
    }
    private __onResponse: (response: IMessageResponse) => void;
    private __requestHandler({ methodName, args, id }: IMessageRequest) {
        let method = this.__methods.get(methodName);
    
        if (typeof method !== 'function') {
            return this.__responseError(id, 404);
        }
        let resultPromise = method(args);
        if (!(resultPromise instanceof Promise)) {
            return this.__responseResult(id, resultPromise);
        }
        resultPromise.then((result) => {
            return this.__responseResult(id, result);
        }, (message) => {
            return this.__responseError(id, 500, message);
        })
    }
    private __onRequest: (request: IMessageRequest) => void;
    private __responseError(id: string, code: number, message?: string){
        this.__channel.dispatch(this.__responseEvent, <IMessageResponse>{
            id,
            error: {
                message,
                code
            }
        });
    };
    private __responseResult(id: string, result: any){
        this.__channel.dispatch(this.__responseEvent, <IMessageResponse>{
            id,
            result
        });
    };
}
