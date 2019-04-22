let injectScript = (fileName: string) => {
    let scriptElement = document.createElement("script");
    scriptElement.setAttribute("type", "text/javascript");
    scriptElement.src = chrome.extension.getURL(fileName);
    setTimeout(() => {
        document.head.appendChild(scriptElement);
    }, 100)
};

export { injectScript };
