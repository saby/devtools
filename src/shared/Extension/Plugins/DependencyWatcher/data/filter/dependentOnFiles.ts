import { FilterFunction, FilterFunctionGetter } from "./Filter";
import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';

export let dependentOnFiles: FilterFunctionGetter<number[] | undefined, IModule> = (keys?: number[]): FilterFunction<IModule> => {
    if (!keys || !keys.length) {
        return () => true;
    }
    return (item: IModule) => {
        if (item.fileId && keys.includes(item.fileId)) {
            return false;
        }
        const { dependencies } = item;
        return [
            ...Array.from(dependencies.static),
            ...Array.from(dependencies.dynamic),
        ].some(({ fileId }) => {
            return fileId && keys.includes(fileId);
        });
    }
};
