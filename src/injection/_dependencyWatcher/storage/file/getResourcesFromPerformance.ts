import { CDN_ROOT, RESOURCE_ROOT } from 'Extension/Plugins/DependencyWatcher/const';

function isResource(path: string): boolean {
   return [RESOURCE_ROOT, CDN_ROOT].some((partOfPath: string) => {
      return path.includes(partOfPath);
   });
}

const resourceCache: Map<string, number> = new Map();

function updateResourceCache(): void {
   const resourceTimingList = performance.getEntriesByType(
      'resource'
   ) as PerformanceResourceTiming[];
   resourceTimingList.filter(({ name }) => {
      return isResource(name);
   }).forEach((entry: PerformanceResourceTiming) => {
      // tslint:disable-next-line:no-bitwise
      resourceCache.set(entry.name, entry.transferSize | entry.decodedBodySize);
   });
   window.performance.clearResourceTimings();
}

window.performance.addEventListener('resourcetimingbufferfull', updateResourceCache);

function getResourcesFromPerformance(): Array<[string, number]> {
   updateResourceCache();
   const resourcesFromCache = Array.from(resourceCache.entries());
   resourceCache.clear();
   return resourcesFromCache;
}

export default getResourcesFromPerformance;
