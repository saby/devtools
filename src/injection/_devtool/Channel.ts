import { IEventEmitter, IHandler, ISerializable } from 'Extension/Event/IEventEmitter';
import { Emitter } from 'Extension/Event/Emitter';
import { IMessageWrapper, IMessageData, IContentMessageEvent } from 'Extension/Event/IContentMessage';
import { POST_MESSAGE_SOURCE } from 'Extension/const';

const RANDOM_OFFSET = 2;
/**
 * id вкладки, подмешиваемый во все сообщения.
 * Нужен для того чтобы не ловить на вкладке сообщения от самих себя
 */
const TAB_ID = Math.random().toString().substr(RANDOM_OFFSET);

interface IWrapper extends IMessageWrapper {
    __tabId__: string;
}

class DevtoolChannel implements IEventEmitter {
    private emitter: Emitter;
    private onmessageHandler: (event: IContentMessageEvent<IWrapper>) => void;

    constructor(private name: string) {
        this.emitter = new Emitter();
        this.onmessageHandler = this.__onmessage.bind(this);
        window.addEventListener('message', this.onmessageHandler);
    }

    dispatch(event: string, args?: ISerializable): boolean {
        window.postMessage({
            source: POST_MESSAGE_SOURCE,
            data: {
                source: this.name,
                args,
                event
            },
            __tabId__: TAB_ID
        } as IWrapper, '*');

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
        window.removeEventListener('message', this.onmessageHandler);
        delete this.onmessageHandler;
    }

    private __onmessage(event: IContentMessageEvent<IWrapper>): void {
        if (!event.data) {
            return;
        }
        const { source, data, __tabId__ } = event.data;
        if ((source !== POST_MESSAGE_SOURCE) || (__tabId__ === TAB_ID)) {
            return;
        }
        this.__dispatch(data);
    }
    private __dispatch({ source, args, event }: IMessageData): void {
        if (source !== this.name) {
            return;
        }
        this.emitter.dispatch(event, args);
    }
}

export {
    DevtoolChannel
};
