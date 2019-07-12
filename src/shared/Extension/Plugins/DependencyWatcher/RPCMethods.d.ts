import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { Stack } from "Extension/Plugins/DependencyWatcher/IFile";

export interface RPCMethodsArgs extends Record<RPCMethodNames, unknown> {
    [RPCMethodNames.getModules]: number[] | undefined;
    [RPCMethodNames.getUpdates]: void;
    [RPCMethodNames.getStacks]: number[];
    [RPCMethodNames.isRelease]: void;
    [RPCMethodNames.setSize]: {
        size: number;
        fileId: number;
        // fileName?: string;
    }
}

export interface RPCMethodsResult extends Record<RPCMethodNames, unknown> {
    [RPCMethodNames.getModules]: ModulesRecord<TransferModule>;
    [RPCMethodNames.getUpdates]: number[];
    [RPCMethodNames.setSize]: boolean;
    [RPCMethodNames.isRelease]: boolean;
    [RPCMethodNames.getStacks]: Record<number, Stack>;
}
