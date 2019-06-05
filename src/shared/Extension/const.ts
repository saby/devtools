export const PANEL_NAME = 'Wasaby';

export const UPDATE_MESSAGE = '';

export const POST_MESSAGE_SOURCE = `${ PANEL_NAME }/content-message`;

export const BACKGROUND_PORT_NAME = `${ PANEL_NAME }/background`;

export const DEVTOOL_PORT_NAME = `${ PANEL_NAME }/devtool`;

export const CONTENT_PORT_NAME = `${ PANEL_NAME }/content`;

export const DEVTOOL_CONTENT_PORT = `${ PANEL_NAME }/devtool-content`;

export const PORT_TAB_ID_POSTFIX = `:tabId=`;

export const INJECTION_SCRIPT = './wasaby_devtool.js';

export const GLOBAL_CHANNEL_NAME = 'globalChannel';

export enum GlobalMessages {
    devtoolsInitialized = 'devtoolsInitialized',
    wasabyInitialized = 'wasabyInitialized',
}

export const LOGGER_CHANNEL_NAME = 'loggerChannel';
