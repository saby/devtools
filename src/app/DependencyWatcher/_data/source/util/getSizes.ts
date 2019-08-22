import { isResource } from 'Extension/Plugins/DependencyWatcher/util/isResource';

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

const mapHARToSizesRecord = (har: HAR): Sizes => {
    const result: Sizes = Object.create(null);
    for (const { request, response } of har.entries) {
        if (!isResource(request.url)) {
            continue;
        }
        result[request.url] = response._transferSize || response.content.size;
    }
    return result;
};

const getHAR = (): Promise<HAR> => {
    return new Promise<HAR>((resolve, reject) => {
        chrome.devtools.network.getHAR((harLog) => {
            // @ts-ignore
            resolve(harLog);
        });
    });
};

export const getSizes = (): Promise<Sizes> => {
    return getHAR().then(mapHARToSizesRecord)
};
