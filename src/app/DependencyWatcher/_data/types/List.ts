import { ModuleInfo } from "Extension/Plugins/DependencyWatcher/IModule";

export interface Item extends ModuleInfo {
    parent?: string;
    child: boolean | null;
    id: string;
    isDynamic?: boolean;
    notUsed?: boolean;
    size?: number;
    fileName?: string;
}
