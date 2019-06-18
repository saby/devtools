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
interface Sizes  extends Record<string, number> {

}
let mapHARToSizesRecord = (har: HAR): Sizes => {
    let result: Sizes = Object.create(null);
    for (let { request, response } of har.entries) {
        result[request.url] = response._transferSize;
    }
    return result;
};

let getHAR = (): Promise<HAR> => {
    return new Promise<HAR>((resolve, reject) => {
        chrome.devtools.network.getHAR((harLog) => {
            // @ts-ignore
            resolve(harLog);
        });
    });
};

let findSize = (module: string, sizes: Sizes): HARResponse | undefined => {
    for (let url in sizes) {
        if (Object.prototype.hasOwnProperty.call(sizes, url) && url.includes(module)) {
            return sizes[url];
        }
    }
    return;
};
let lastSizes: Sizes = Object.create(null);
let findSizeCached = (module: string): Promise<HARResponse | undefined> => {
    let size = findSize(module, lastSizes);
    if (size) {
        return  Promise.resolve(size);
    }
    return getHAR().then((har) => {
        lastSizes = {
            ...lastSizes,
            ...mapHARToSizesRecord(har)
        };
        return findSize(module, lastSizes);
    })
};

export let getSize = (module: string): Promise<number | undefined> => {
    return findSizeCached(module);
};
