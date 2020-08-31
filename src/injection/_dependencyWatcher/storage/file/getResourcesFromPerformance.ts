import {
   CDN_ROOT,
   RESOURCE_ROOT
} from 'Extension/Plugins/DependencyWatcher/const';

function isResource(path: string): boolean {
   return [RESOURCE_ROOT, CDN_ROOT].some((partOfPath: string) => {
      return path.includes(partOfPath);
   });
}

let resourceCache: Set<string>;

function updateResourceCache(): void {
   const resourceTimingList = performance.getEntriesByType(
      'resource'
   ) as PerformanceResourceTiming[];
   resourceTimingList
      .filter(({ name }) => {
         return isResource(name);
      })
      .forEach((entry: PerformanceResourceTiming) => {
         resourceCache.add(
            entry.name
         );
      });
   window.performance.clearResourceTimings();
}

export function init(): void {
   resourceCache = new Set();
   window.performance.addEventListener(
      'resourcetimingbufferfull',
      updateResourceCache
   );
}

/**
 * Collects information about resources using Resource Timing API and returns only the necessary information (URL).
 * @author Зайцев А.С.
 */
function getResourcesFromPerformance(): string[] {
   updateResourceCache();
   const resourcesFromCache = Array.from(resourceCache.values());
   resourceCache.clear();
   return resourcesFromCache;
}

export default getResourcesFromPerformance;
