import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";

export interface RPCMethodsArgs extends Record<RPCMethodNames, unknown> {
    [RPCMethodNames.getModules]: string[];
    [RPCMethodNames.isRelease]: void;
    [RPCMethodNames.setSize]: {
        size: number;
        fileId?: number;
        fileName?: string;
    }
}

export interface RPCMethodsResult extends Record<RPCMethodNames, unknown> {
    [RPCMethodNames.getModules]: ModulesRecord<TransferModule>;
    [RPCMethodNames.setSize]: boolean;
    [RPCMethodNames.isRelease]: boolean;
}
