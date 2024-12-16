export const PANEL_NAME = 'Wasaby';

export const POST_MESSAGE_SOURCE = `${PANEL_NAME}/content-message`;

export const DEVTOOL_CONTENT_PORT = `${PANEL_NAME}/devtool-content`;

export const PORT_TAB_ID_POSTFIX = ':tabId=';

export const INJECTION_SCRIPT = './wasaby_devtool.js';

export const GLOBAL_CHANNEL_NAME = 'globalChannel';

export enum GlobalMessages {
   devtoolsInitialized = 'devtoolsInitialized',
   wasabyInitialized = 'wasabyInitialized',
   devtoolsClosed = 'devtoolsClosed'
}

export const LOGGER_CHANNEL_NAME = 'loggerChannel';
