import { IDevToolsEvent } from '../../interface/IDevToolsEvent';
import { IChannel } from '../../interface/IChannel';

class Channel implements IChannel {
   private _port: chrome.runtime.Port;

   constructor(port: chrome.runtime.Port) {
      this._port = port;
   }

   send(message: IDevToolsEvent): void {
      this._port.postMessage(message);
   }

   listen(callback: (message: IDevToolsEvent) => void): void {
      this._port.onMessage.addListener(callback);
   }
}

export default Channel;
