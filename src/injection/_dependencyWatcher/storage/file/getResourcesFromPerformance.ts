import {
   CDN_ROOT,
   RESOURCE_ROOT
} from 'Extension/Plugins/DependencyWatcher/const';

function isResource(path: string): boolean {
   return [RESOURCE_ROOT, CDN_ROOT].some((partOfPath: string) => {
      return path.includes(partOfPath);
   });
}

let resourceCache: Map<string, number>;

function updateResourceCache(): void {
   const resourceTimingList = performance.getEntriesByType(
      'resource'
   ) as PerformanceResourceTiming[];
   resourceTimingList
      .filter(({ name }) => {
         return isResource(name);
      })
      .forEach((entry: PerformanceResourceTiming) => {
         resourceCache.set(
            entry.name,
            // tslint:disable-next-line:no-bitwise
            entry.transferSize | entry.decodedBodySize
         );
      });
   window.performance.clearResourceTimings();
}

export function init(): void {
   resourceCache = new Map();
   window.performance.addEventListener(
      'resourcetimingbufferfull',
      updateResourceCache
   );
}

/**
 * Collects information about resources using Resource Timing API and returns only the necessary information (URL and size).
 * @author Зайцев А.С.
 */
function getResourcesFromPerformance(): Array<[string, number]> {
   updateResourceCache();
   const resourcesFromCache = Array.from(resourceCache.entries());
   resourceCache.clear();
   return resourcesFromCache;
}

export default getResourcesFromPerformance;
