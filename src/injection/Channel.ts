import { IChannel } from '../interface/IChannel';
import { IDevToolsEvent } from '../interface/IDevToolsEvent';

class Channel implements IChannel {
   private _listeners: Array<(message: MessageEvent) => void> = [];

   constructor() {
      this.listen(({type}) => {
         if (type === 'shutdown') {
            this._listeners.forEach((listener) => {
               window.removeEventListener('message', listener);
            });
         }
      });
   }

   send(message: IDevToolsEvent): void {
      window.postMessage({
         source: 'wasaby-devtool',
         ...message
      }, '*');
   }

   listen(callback: (message: IDevToolsEvent) => void): void {
      function listener(message: MessageEvent): void {
         const { source, data }: MessageEvent = message;
         if (source === window && data && data.source === 'wasaby-contentScript') {
            callback(message);
         }
      }
      this._listeners.push(listener);
      window.addEventListener('message', listener);
   }
}

const channel = new Channel();

export {
   channel
};
