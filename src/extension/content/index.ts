import {
    POST_MESSAGE_SOURCE,
    INJECTION_SCRIPT,
    CONTENT_PORT_NAME,
    DEVTOOL_PORT_NAME
} from 'ExtensionCore/const';
import { injectScript } from './injectScript';

const getPort = (() => {
    let port: chrome.runtime.Port | void;
    return (name: string) => {
        if (port) {
            return port;
        }
        port = chrome.runtime.connect({
            name
        });

        port.onDisconnect.addListener(() => {
            port = undefined;
        });
        return port;
    };
})();

const getBackgroundPort = () => getPort(CONTENT_PORT_NAME);

function handleMessageFromDevTools(message: MessageEvent): void {
    window.postMessage({
        ...message,
        source: DEVTOOL_PORT_NAME
    }, '*');
}

getBackgroundPort().onMessage.addListener(handleMessageFromDevTools);

function handleMessageFromPage(event: MessageEvent): void {
    if (event.source !== window || !event.data) {
        return;
    }

    if (event.data.source !== POST_MESSAGE_SOURCE) {
        return;
    }

    getBackgroundPort().postMessage(event.data);
}
window.addEventListener('message', handleMessageFromPage, false);

getBackgroundPort().onDisconnect.addListener(() => {
    window.removeEventListener('message', handleMessageFromPage);
});

injectScript(INJECTION_SCRIPT);
