import { IModulesDependencyMap } from "Extension/Plugins/DependencyWatcher/Module";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";

export interface IQuery<TFilter> {
    data: IModulesDependencyMap,
    where: TFilter,
    bundles: Bundles;
}
