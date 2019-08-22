import { CDN_ROOT, RESOURCE_ROOT } from 'Extension/Plugins/DependencyWatcher/const';

export const isResource = (path: string): boolean => {
    return [RESOURCE_ROOT, CDN_ROOT].some((partOfPath: string) => {
        return path.includes(partOfPath);
    });
};
