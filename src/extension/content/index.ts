const TYPE = 'wasaby-devtool';

window.addEventListener("message", function ({ source, data }: MessageEvent) {
    if (source != window || data.type !== TYPE) {
        return;
    }
    try {
        chrome.runtime.sendMessage(data, function(response) {
            // code here
        });
    } catch (error) {
        debugger;
    }
}, false);

let injectScript = (fileName: string) => {
    let scriptElement = document.createElement("script");
    scriptElement.setAttribute("type", "text/javascript");
    scriptElement.src = chrome.extension.getURL(fileName);
    setTimeout(() => {
        document.head.appendChild(scriptElement);
        console.log("=> inject");
    }, 100)
};
injectScript('./injection/require.js');
