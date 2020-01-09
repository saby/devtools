import {
    IContentMessageEvent,
    IMessageData,
    IMessageWrapper
} from 'Extension/Event/IContentMessage';

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
    __proxyMessage__?: true;
}

const getProxyToPage = (source: string) => {
    return (data: IMessageData): void => {
        window.postMessage({
            data,
            source,
            __proxyMessage__: true
        } as IWrapper, '*');
    };
};

const getProxyToPort = (
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

interface ICreateConfig {
    portName: string;
    source: string;
}

const createProxy = ({
   portName,
   source
}: ICreateConfig) => {
    const port = getPort(portName);

    const proxyToPort = getProxyToPort(port, source);
    const proxyToPage = getProxyToPage(source);

    port.onMessage.addListener(proxyToPage);
    port.onDisconnect.addListener(() => {
        window.removeEventListener('message', proxyToPort);
    });

    window.addEventListener('message', proxyToPort, false);
};

export { createProxy };
