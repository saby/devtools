import {
    IContentMessageEvent,
    IMessageData,
    IMessageWrapper
} from "Extension/Event/IContentMessage";

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

interface IWrapper extends IMessageWrapper {
    __proxyMessage__?: true
}

let getProxyToPage = (source: string) => {
    return (data: IMessageData): void => {
        window.postMessage(<IWrapper>{
            data,
            source,
            __proxyMessage__: true
        }, '*');
    };
};

let getProxyToPort = (
    port: chrome.runtime.Port,
    proxySource: string
) => {
    return (event: IContentMessageEvent<IWrapper>): void => {
        if (event.source !== window || !event.data) {
            return;
        }
        const { source, data, __proxyMessage__ } = event.data;

        if (source !== proxySource || __proxyMessage__) {
            return;
        }
        port.postMessage(data);
    };
};

interface CreateConfig {
    portName: string;
    source: string;
}

let createProxy = ({
   portName,
   source
}: CreateConfig) => {
    let port = getPort(portName);

    let proxyToPort = getProxyToPort(port, source);
    let proxyToPage = getProxyToPage(source);

    port.onMessage.addListener(proxyToPage);
    port.onDisconnect.addListener(() => {
        window.removeEventListener('message', proxyToPort);
    });

    window.addEventListener('message', proxyToPort, false);
};

export { createProxy };
