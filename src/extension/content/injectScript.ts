const injectScript = (fileName: string) => {
    const scriptElement = document.createElement('script');
    scriptElement.setAttribute('type', 'text/javascript');
    scriptElement.src = chrome.extension.getURL(fileName);
    document.documentElement.appendChild(scriptElement);
    if (scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
    }
};

export { injectScript };
