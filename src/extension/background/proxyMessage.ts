interface onMessage {
    (message: MessageEvent): void;
}
interface onDisconnect {
    (port: chrome.runtime.Port): void;
}

let getMessageProxy = (port: chrome.runtime.Port): onMessage => {
    return (message: MessageEvent) => {
        port.postMessage(message);
    }
};

let getOnDisconnect = (
    dependentPort: chrome.runtime.Port,
    messageProxy: onMessage
): onDisconnect => {
    return (port: chrome.runtime.Port) => {
        dependentPort.onMessage.removeListener(messageProxy);
    };
};

let createProxy = (
    port1: chrome.runtime.Port,
    port2: chrome.runtime.Port,
) => {
    let proxyTo1: onMessage = getMessageProxy(port1);
    let proxyTo2: onMessage = getMessageProxy(port2);
    
    let onDisconnect1: onDisconnect = getOnDisconnect(port2, proxyTo1);
    let onDisconnect2: onDisconnect = getOnDisconnect(port1, proxyTo2);
    
    port1.onMessage.addListener(proxyTo2);
    port2.onMessage.addListener(proxyTo1);
    
    port1.onDisconnect.addListener(onDisconnect1);
    port2.onDisconnect.addListener(onDisconnect2);
};

export { createProxy };
