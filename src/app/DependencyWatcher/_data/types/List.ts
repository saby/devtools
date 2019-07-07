import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

export interface ItemStackStep {
    fileName: string;
    moduleName: string;
    path: string;
}
export interface ItemStack extends Array<ItemStackStep> {

}

export interface Item extends ModuleInfo {
    parent?: string;
    child: boolean | null;
    id: string;
    isDynamic?: boolean;
    notUsed?: boolean;
    size?: number;
    fileName?: string;
    stack?: ItemStack
}
