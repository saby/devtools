import { isResource } from 'Extension/Plugins/DependencyWatcher/util/isResource';

interface IResourceTiming {
   path: string;
   transferSize: number;
   decodedBodySize: number;
   encodedBodySize: number;
}

function getResourceFromPerformance(): IResourceTiming[] {
   const resourceTimingList = performance.getEntriesByType(
      'resource'
   ) as PerformanceResourceTiming[];
   return resourceTimingList
      .filter(({ name }) => {
         return isResource(name);
      })
      .map((entry: PerformanceResourceTiming) => {
         return {
            path: entry.name,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize,
            encodedBodySize: entry.encodedBodySize
         };
      });
}

export default getResourceFromPerformance;
