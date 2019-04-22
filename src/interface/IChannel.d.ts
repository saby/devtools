import { IDevToolsEvent } from './IDevToolsEvent';

export interface IChannel {
   send(message: IDevToolsEvent): void;
   listen(callback: (message: IDevToolsEvent) => void): void;
}
