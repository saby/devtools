let getMessageProxy = (port: chrome.runtime.Port) => {
    return (message: MessageEvent) => {
        port.postMessage(message);
    }
};

let getOnDisconnect = (
    dependentPort: chrome.runtime.Port,
    messageProxy
) => {
    return (port: chrome.runtime.Port) => {
        dependentPort.onMessage.removeListener(messageProxy);
    };
};

let createProxy = (
    port1: chrome.runtime.Port,
    port2: chrome.runtime.Port,
) => {
    let proxyTo1 = getMessageProxy(port1);
    let proxyTo2 = getMessageProxy(port2);
    
    let onDisconnect1 = getOnDisconnect(port2, proxyTo1);
    let onDisconnect2 = getOnDisconnect(port1, proxyTo2);
    
    port1.onMessage.addListener(proxyTo2);
    port2.onMessage.addListener(proxyTo1);
    
    port1.onDisconnect.addListener(onDisconnect1);
    port2.onDisconnect.addListener(onDisconnect2);
};

export { createProxy };
