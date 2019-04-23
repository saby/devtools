import { IEventEmitter, ISerializable } from '../../interface/IEventEmitter';
import { Emitter } from './Emitter';
import { IMessageData } from "interface/IContentMessage";

class PortChannel implements IEventEmitter {
    private __emitter: Emitter;
    private __onmessageHandler;
    
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
    addListener(event: string, callback): this {
        this.__emitter.addListener(event, callback);
        return this;
    }
    removeListener(event: string, callback): this {
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
        this.__emitter.dispatch(event, args);
    }
}

export {
    PortChannel
};
