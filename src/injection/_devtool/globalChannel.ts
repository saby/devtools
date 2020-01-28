import { DevtoolChannel } from './Channel';
import { GLOBAL_CHANNEL_NAME } from 'Extension/const';

const globalChannel = new DevtoolChannel(GLOBAL_CHANNEL_NAME);

export { globalChannel };
