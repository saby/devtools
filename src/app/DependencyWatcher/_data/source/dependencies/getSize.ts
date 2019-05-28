interface HARResponse {
    content: {
        mimeType: string
        size: number
    }
    _transferSize: number;
}
interface HAREntry {
    cache: object
    connection: string
    request: {
        url: string,
    }
    response: HARResponse
}

interface HAR {
    entries: HAREntry[]
}

let getHAR = (): Promise<HAR> => {
    return new Promise<HAR>((resolve, reject) => {
        chrome.devtools.network.getHAR((harLog) => {
            // @ts-ignore
            resolve(harLog);
        });
    });
};


let findSize = (module: string, har: HAR): number | void => {
    for (let { request, response } of har.entries) {
        if (request.url.includes(module)) {
            return response._transferSize;
        }
    }
};

let lastHar: HAR | void;
let findResponse = (module: string, har: HAR): HARResponse | undefined => {
    for (let { request, response } of har.entries) {
        if (request.url.includes(module)) {
            return response;
        }
    }
    return;
};
let find = (module: string): Promise<HARResponse | undefined> => {
    if (lastHar) {
        let response = findResponse(module, lastHar);
        if (response) {
            return  Promise.resolve(response);
        }
    }
    return getHAR().then((har) => {
        lastHar = har;
        return findResponse(module, har);
    })
};

export let getSize = (module: string): Promise<number | undefined> => {
    return find(module).then((response?: HARResponse) => {
        if (!response) {
            return;
        }
        return response._transferSize;
    })
};
