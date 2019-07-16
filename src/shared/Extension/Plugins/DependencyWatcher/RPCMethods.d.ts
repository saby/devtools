import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { ModulesRecord, ITransferModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { Stack } from "Extension/Plugins/DependencyWatcher/IFile";
import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IItemFilter, IItemInfo, ITransferItem } from "Extension/Plugins/DependencyWatcher/IItem";

export interface RPCMethodsArgs extends Record<RPCMethodNames, unknown> {
    // Modules
    [RPCMethodNames.getModules]: number[] | undefined;
    [RPCMethodNames.getUpdates]: void;
    // Items
    [RPCMethodNames.queryItems]: QueryParam<IItemInfo, IItemFilter>;
    [RPCMethodNames.getItems]: number[];
    // File
    [RPCMethodNames.getStacks]: number[];
    [RPCMethodNames.setSize]: {
        size: number;
        fileId: number;
        // fileName?: string;
    }
    // other
    [RPCMethodNames.isRelease]: void;
}

export interface RPCMethodsResult extends Record<RPCMethodNames, unknown> {
    // Modules
    [RPCMethodNames.getModules]: ModulesRecord<ITransferModule>;
    [RPCMethodNames.getUpdates]: number[];
    // Items
    [RPCMethodNames.queryItems]: QueryResult<number>;
    [RPCMethodNames.getItems]: ITransferItem[];
    // File
    [RPCMethodNames.setSize]: boolean;
    [RPCMethodNames.getStacks]: Record<number, Stack>;
    // other
    [RPCMethodNames.isRelease]: boolean;
}
