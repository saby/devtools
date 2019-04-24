import { IEventEmitter, IHandler, ISerializable } from 'interface/IEventEmitter';
import { Emitter } from './Emitter';
import { IMessageWrapper, IMessageData, IContentMessageEvent } from 'interface/IContentMessage';
import { POST_MESSAGE_SOURCE } from './const';

/**
 * id вкладки, подмешиваемый во все сообщения.
 * Нужен для того чтобы не ловить на вкладке сообщения от самих себя
 */
const TAB_ID = Math.random().toString().substr(2);

interface IWrapper extends IMessageWrapper {
    __tabId__: string;
}

class DevtoolChannel implements IEventEmitter {
    private __emitter: Emitter;
    private __onmessageHandler;
    
    constructor(private __name: string) {
        this.__emitter = new Emitter();
        this.__onmessageHandler = this.__onmessage.bind(this);
        window.addEventListener('message', this.__onmessageHandler);
    }
    
    dispatch(event: string, args?: ISerializable): boolean {
        window.postMessage(<IWrapper>{
            source: POST_MESSAGE_SOURCE,
            data: {
                source: this.__name,
                args,
                event
            },
            __tabId__: TAB_ID
        }, '*');
        
        return true;
    }
    addListener(event: string, callback: IHandler): this {
        this.__emitter.addListener(event, callback);
        return this;
    }
    removeListener(event: string, callback: IHandler): this {
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
    
    private __onmessage(event: IContentMessageEvent<IWrapper>) {
        if (!event.data) {
            return;
        }
        const { source, data, __tabId__ } = event.data;
        if ((source !== POST_MESSAGE_SOURCE) || (__tabId__ === TAB_ID)) {
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
