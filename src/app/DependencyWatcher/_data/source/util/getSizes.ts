import { isResource } from 'Extension/Plugins/DependencyWatcher/util/isResource';

interface IHARResponse {
   content: {
      mimeType: string;
      size: number;
   };
   _transferSize: number;
}
interface IHAREntry {
   cache: object;
   connection: string;
   request: {
      url: string;
   };
   response: IHARResponse;
}

interface IHAR {
   entries: IHAREntry[];
}

type Sizes = Record<string, number>;

function mapHARToSizesRecord(har: IHAR): Sizes {
   const result: Sizes = Object.create(null);
   for (const { request, response } of har.entries) {
      if (!isResource(request.url)) {
         continue;
      }
      result[request.url] = response._transferSize || response.content.size;
   }
   return result;
}

function getHAR(): Promise<IHAR> {
   return new Promise<IHAR>((resolve) => {
      chrome.devtools.network.getHAR((harLog) => {
         resolve(harLog as IHAR);
      });
   });
}

export function getSizes(): Promise<Sizes> {
   return getHAR().then(mapHARToSizesRecord);
}
