import { DevtoolChannel } from './Channel';
import { GLOBAL_CHANNEL_NAME } from 'Extension/const';

let globalChannel: DevtoolChannel;

function getGlobalChannel(): DevtoolChannel {
   if (!globalChannel) {
      globalChannel = new DevtoolChannel(GLOBAL_CHANNEL_NAME);
   }
   return globalChannel;
}

export { getGlobalChannel };
