import { IDependencies } from "Extension/Plugins/DependencyWatcher/IModule";
import { ListAbstract } from "./ListAbstract";
import { ITransferItem } from "Extension/Plugins/DependencyWatcher/IItem";

export class Dependencies extends ListAbstract {
    protected _getChildren(item: ITransferItem): IDependencies<number[]> {
        return item.dependencies;
    }
}
