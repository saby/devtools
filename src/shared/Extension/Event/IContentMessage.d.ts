import { ISerializable } from './IEventEmitter';

export interface IMessageData {
   source: string; // "плагин" инициаор
   args: ISerializable; // данные сообщения
   event: string; // имя события
}

export interface IMessageWrapper {
   source: string; // флаг по которону удостоверяемся что расширение наше
   data: IMessageData;
}

export interface IContentMessageEvent<
   T extends IMessageWrapper = IMessageWrapper
> extends MessageEvent {
   data: T | void;
}
