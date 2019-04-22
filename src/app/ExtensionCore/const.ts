export const PANEL_NAME = 'Wasaby';

export const UPDATE_MESSAGE = '';

export const POST_MESSAGE_SOURCE = `${ PANEL_NAME }/content-message`;

export const BACKGROUND_PORT_NAME = `${ PANEL_NAME }/background`;

export const DEVTOOL_PORT_NAME = `${ PANEL_NAME }/devtool`;

export const INJECTION_SCRIPT = './injection/injection.js';

export enum MESSAGE_TARGET {
    devtool = 'devtool',
    page = 'page',
    background = 'background'
}
