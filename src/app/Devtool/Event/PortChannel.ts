import { IEventEmitter, IHandler, ISerializable } from 'Extension/Event/IEventEmitter';
import { Emitter } from 'Extension/Event/Emitter';
import { IMessageData } from 'Extension/Event/IContentMessage';
import EvaluationExceptionInfo = chrome.devtools.inspectedWindow.EvaluationExceptionInfo;

class PortChannel implements IEventEmitter {
    private emitter: Emitter;

    constructor(
        private name: string,
        private port: chrome.runtime.Port
    ) {
        this.emitter = new Emitter();
        this.__onmessage = this.__onmessage.bind(this);
        this.port.onMessage.addListener(this.__onmessage);
    }

    dispatch(event: string, args?: ISerializable): boolean {
        this.port.postMessage({
            source: this.name,
            args,
            event
        });
        return true;
    }
    addListener<T>(event: string, callback: IHandler<T>): this {
        this.emitter.addListener(event, callback);
        return this;
    }
    removeListener<T>(event: string, callback: IHandler<T>): this {
        this.emitter.removeListener(event, callback);
        return this;
    }
    removeAllListeners(event?: string): this {
        this.emitter.removeAllListeners(event);
        return this;
    }
    destructor(): void {
        this.emitter.destructor();
        this.port.onMessage.removeListener(this.__onmessage);
    }

    private __onmessage({ source, args, event }: IMessageData): void {
        if (source !== this.name) {
            return;
        }
        if (event === 'longMessage') {
            this.__onLongMessage();
        } else {
            this.emitter.dispatch(event, args);
        }
    }

    private __onLongMessage(): void {
        chrome.devtools.inspectedWindow.eval(
           'window.__WASABY_DEV_HOOK__.readMessageQueue()',
           (result: Array<[string, ISerializable?]>, exceptionInfo: EvaluationExceptionInfo) => {
               if (exceptionInfo) {
                   throw new Error('Code evaluation failed');
               } else {
                   result.forEach((event) => {
                       this.emitter.dispatch(event[0], event[1]);
                   });
               }
           }
        );
    }
}

export {
    PortChannel
};
