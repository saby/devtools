import {
    POST_MESSAGE_SOURCE,
    INJECTION_SCRIPT,
    DEVTOOL_PORT_NAME,
    BACKGROUND_PORT_NAME,
    MESSAGE_TARGET
} from "ExtensionCore/const";
import { injectScript } from'./injectScript';

let getPort = (() => {
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
    }
})();

let getDevtoolPort = () => getPort(DEVTOOL_PORT_NAME);
let getBackgroundPort = () => getPort(BACKGROUND_PORT_NAME);

function handleMessageFromDevTools(message: MessageEvent): void {
    window.postMessage({
        source: POST_MESSAGE_SOURCE,
        type: 'message',
        data: message
    }, '*');
}

getDevtoolPort().onMessage.addListener(handleMessageFromDevTools);

function handleMessageFromPage(event: MessageEvent): void {
    if (event.source !== window || !event.data) {
        return;
    }
    
    let { target, source, data } = event.data;
    
    if (source !== POST_MESSAGE_SOURCE) {
        return;
    }
    if (target == MESSAGE_TARGET.devtool) {
        getDevtoolPort().postMessage(data);
    }
    if (target == MESSAGE_TARGET.background) {
        getBackgroundPort().postMessage(data);
    }
}
window.addEventListener('message', handleMessageFromPage, false);

/*
port.onDisconnect.addListener(() => {
    window.removeEventListener('message', handleMessageFromPage);
});*/

injectScript(INJECTION_SCRIPT);
