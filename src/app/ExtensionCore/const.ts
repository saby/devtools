export const PANEL_NAME = 'Wasaby';

export const UPDATE_MESSAGE = '';

export const POST_MESSAGE_SOURCE = `${ PANEL_NAME }/content-message`;

export const BACKGROUND_PORT_NAME = `${ PANEL_NAME }/background`;

export const DEVTOOL_PORT_NAME = `${ PANEL_NAME }/devtool`;

export const CONTENT_PORT_NAME = `${ PANEL_NAME }/content`;

export const DEVTOOL_CONTENT_PORT = `${ PANEL_NAME }/devtool-content`;

export const PORT_TAB_ID_POSTFIX = `:tabId=`;

export const INJECTION_SCRIPT = './injection/injection.js';

export enum OperationType {
    REMOVE,
    ADD,
    REORDER,
    UPDATE
}
