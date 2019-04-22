import { ISerializable } from "./IEventEmitter";

export interface IMessageData {
    source: string;
    args: ISerializable;
    event: string
}
export interface IBroadCastMessageData {
    type: 'message';
    data: IMessageData
}

export interface ICommandData {
    command: string;
}
export interface IBroadCastCommandData {
    type: 'command';
    data: ICommandData;
}

export interface IBroadCastSimpleData {
    source: string;
    target: 'page' | 'devtool' | 'background'
    type: string;
}

interface IMessage {
    source: string;
}

interface IMessageFromPage extends IMessage {
    target: 'devtool' | 'background'
    type: string;
}

export type IBroadCastData = IBroadCastSimpleData & (IBroadCastMessageData | IBroadCastCommandData);

export interface IBroadCastEvent extends MessageEvent {
    data: IBroadCastData;
}
