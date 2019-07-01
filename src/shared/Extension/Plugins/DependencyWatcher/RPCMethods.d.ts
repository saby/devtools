import { RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";

export interface RPCMethodsArgs extends Record<RPCMethods, unknown> {
    [RPCMethods.getModules]: string[];
    [RPCMethods.setSize]: {
        size: number;
        fileId: number;
    }
}

export interface RPCMethodsResult extends Record<RPCMethods, unknown> {
    [RPCMethods.getModules]: ModulesRecord<TransferModule>;
    [RPCMethods.setSize]: boolean;
}
