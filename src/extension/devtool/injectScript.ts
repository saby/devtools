export let injectScript = (filename: string) => {
    return fetch(chrome.extension.getURL(filename), {
        method: 'GET'
    }).then((response: Response) => {
        return response.text();
    }).then((scriptText: string) => {
        return new Promise((resolve, reject) => {
            chrome.devtools.inspectedWindow.eval(
                scriptText,
                function(result, isError) {
                    if (isError) {
                        return reject(result);
                    }
                    return resolve(result);
                }
            );
        });
    });
};
