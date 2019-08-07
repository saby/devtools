import { IEventEmitter, IHandler, ISerializable } from 'Extension/Event/IEventEmitter';
import { Emitter } from 'Extension/Event/Emitter';
import { IMessageData } from "Extension/Event/IContentMessage";
import EvaluationExceptionInfo = chrome.devtools.inspectedWindow.EvaluationExceptionInfo;

class PortChannel implements IEventEmitter {
    private __emitter: Emitter;
    private __onmessageHandler: (arg: IMessageData) => void;

    constructor(
        private __name: string,
        private __port: chrome.runtime.Port
    ) {
        this.__emitter = new Emitter();
        this.__onmessageHandler = this.__onmessage.bind(this);
        this.__port.onMessage.addListener(this.__onmessageHandler);
    }

    dispatch(event: string, args?: ISerializable): boolean {
        this.__port.postMessage({
            source: this.__name,
            args,
            event
        });
        return true;
    }
    addListener<T>(event: string, callback: IHandler<T>): this {
        this.__emitter.addListener(event, callback);
        return this;
    }
    removeListener<T>(event: string, callback: IHandler<T>): this {
        this.__emitter.removeListener(event, callback);
        return this;
    }
    removeAllListeners(event?: string): this {
        this.__emitter.removeAllListeners(event);
        return this;
    }
    destructor() {
        this.__emitter.destructor();
        this.__port.onMessage.removeListener(this.__onmessageHandler);
        delete this.__onmessageHandler;
    }

    private __onmessage({ source, args, event }: IMessageData) {
        if (source !== this.__name) {
            return;
        }
        if (event === 'longMessage') {
            this.__onLongMessage();
        } else {
            this.__emitter.dispatch(event, args);
        }
    }

    private __onLongMessage(): void {
        chrome.devtools.inspectedWindow.eval(
           'window.__WASABY_DEV_HOOK__.readMessageQueue()',
           (result: Array<[string, ISerializable?]>, exceptionInfo: EvaluationExceptionInfo) => {
               if (exceptionInfo && (exceptionInfo.isError || exceptionInfo.isException)) {
                   const e = new Error('Code evaluation failed');
                   if (exceptionInfo.isException) {
                       e.stack = exceptionInfo.value;
                   }
                   throw e;
               } else {
                   result.forEach((event) => {
                       this.__emitter.dispatch(event[0], event[1]);
                   });
               }
           }
        );
    }
}

export {
    PortChannel
};
