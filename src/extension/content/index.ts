const SOURCE = 'wasaby-devtool';

const port = chrome.runtime.connect({
    name: 'wasaby-contentScript'
});

function handleMessageFromDevTools(message: MessageEvent): void {
    window.postMessage({
        source: 'wasaby-contentScript',
        data: message
    }, '*');
}
port.onMessage.addListener(handleMessageFromDevTools);

function handleMessageFromPage({ source, data }: MessageEvent): void {
    if (source === window && data && data.source === SOURCE) {
        port.postMessage(data);
    }
}
window.addEventListener('message', handleMessageFromPage, false);

port.onDisconnect.addListener(() => {
    window.removeEventListener('message', handleMessageFromPage);
});

let injectScript = (fileName: string) => {
    let scriptElement = document.createElement("script");
    scriptElement.setAttribute("type", "text/javascript");
    scriptElement.src = chrome.extension.getURL(fileName);
    setTimeout(() => {
        document.head.appendChild(scriptElement);
        console.log("=> inject");
    }, 100)
};
injectScript('./injection/injection.js');
