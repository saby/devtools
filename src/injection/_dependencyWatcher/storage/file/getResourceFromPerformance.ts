import { isResource } from 'Extension/Plugins/DependencyWatcher/util/isResource';

export interface ResourceTiming {
    path: string,
    transferSize: number,
    decodedBodySize: number,
    encodedBodySize: number
}

const getResourceFromPerformance = (): ResourceTiming[] => {
    let resourceTimingList = <PerformanceResourceTiming[]> performance.getEntriesByType('resource');
    return resourceTimingList.filter(({ name }) => {
        return isResource(name)
    }).map((entry: PerformanceResourceTiming) => {
        return {
            path: entry.name,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize,
            encodedBodySize: entry.encodedBodySize
        };
    });
};

export default getResourceFromPerformance;
