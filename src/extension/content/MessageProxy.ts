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

let getProxyToPage = (source: string) => {
    return (message: MessageEvent): void => {
        window.postMessage({
            ...message,
            source
        }, '*');
    };
};

let getProxyToPort = (
    port: chrome.runtime.Port,
    source: string
) => {
    return (event: MessageEvent): void => {
        if (event.source !== window || !event.data) {
            return;
        }
        if (event.data.source !== source) {
            return;
        }
        port.postMessage(event.data.data);
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
