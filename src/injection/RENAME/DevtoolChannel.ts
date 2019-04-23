import { IEventEmitter, ISerializable } from 'interface/IEventEmitter';
import { Emitter } from './Emitter';
import { IMessageWrapper, IMessageData } from 'interface/IContentMessage';
import { POST_MESSAGE_SOURCE } from './const';

class DevtoolChannel implements IEventEmitter {
    private __emitter: Emitter;
    private __onmessageHandler;
    
    constructor(private __name: string) {
        this.__emitter = new Emitter();
        this.__onmessageHandler = this.__onmessage.bind(this);
        window.addEventListener('message', this.__onmessageHandler);
    }
    
    dispatch(event: string, args?: ISerializable): boolean {
        window.postMessage({
            source: POST_MESSAGE_SOURCE,
            data: {
                source: this.__name,
                args,
                event
            }
        }, '*');
        
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
        window.removeEventListener('message', this.__onmessageHandler);
        delete this.__onmessageHandler;
    }
    
    private __onmessage({ source, data }: IMessageWrapper) {
        if (source !== POST_MESSAGE_SOURCE) {
            return;
        }
        this.__dispatch(data);
    }
    private __dispatch({ source, args, event }: IMessageData) {
        if (source !== this.__name) {
            return;
        }
        this.__emitter.dispatch(event, args);
    }
}

export {
    DevtoolChannel
};
