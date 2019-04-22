const ports: Record<string, chrome.runtime.Port> = {};

function isNumeric(name: string): boolean {
    return +name + '' === name;
}

chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
    let tab;
    let name;

    if (isNumeric(port.name)) {
        tab = port.name;
        name = 'devtools';
    }
    if (port.name === 'wasaby-contentScript') {
        tab = port.sender.tab.id;
        name = 'contentScript';
    }

    ports[tab + name] = port;

    if (ports[tab + 'devtools'] && ports[tab + 'contentScript']) {
        function devToolsListener(message: MessageEvent): void {
            ports[tab + 'contentScript'].postMessage(message);
        }
        function contentListener(message: MessageEvent): void {
            ports[tab + 'devtools'].postMessage(message);
        }
        ports[tab + 'devtools'].onMessage.addListener(devToolsListener);
        ports[tab + 'contentScript'].onMessage.addListener(contentListener);
        function shutdown(): void {
            ports[tab + 'devtools'].onMessage.removeListener(devToolsListener);
            ports[tab + 'contentScript'].onMessage.removeListener(contentListener);
            ports[tab + 'devtools'].disconnect();
            ports[tab + 'contentScript'].disconnect();
        }
        ports[tab + 'devtools'].onDisconnect.addListener(shutdown);
        ports[tab + 'contentScript'].onDisconnect.addListener(shutdown);
    }
});
