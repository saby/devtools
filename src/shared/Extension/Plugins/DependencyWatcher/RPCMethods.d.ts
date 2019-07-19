import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { ModulesRecord, ITransferModule } from "Extension/Plugins/DependencyWatcher/IModule";
import {
    IFile,
    IFileFilter,
    IFileInfo,
    ITransportFile,
    Stack,
    UpdateFileParam
} from "Extension/Plugins/DependencyWatcher/IFile";
import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { IItemFilter, IItemInfo, ITransferItem, UpdateItemParam } from "Extension/Plugins/DependencyWatcher/IItem";

export interface RPCMethodsArgs extends Record<RPCMethodNames, unknown> {
    // Modules
    [RPCMethodNames.getModules]: number[] | undefined;
    [RPCMethodNames.getUpdates]: void;
    [RPCMethodNames.hasUpdates]: number[];
    // Items
    [RPCMethodNames.queryItems]: QueryParam<IItemInfo, IItemFilter>;
    [RPCMethodNames.getItems]: number[];
    [RPCMethodNames.updateItem]: UpdateItemParam;
    [RPCMethodNames.updateItems]: UpdateItemParam[];
    // File
    [RPCMethodNames.getStacks]: number[];
    [RPCMethodNames.setSize]: {
        size: number;
        fileId: number;
        // fileName?: string;
    }
    [RPCMethodNames.updateFile]: UpdateFileParam;
    [RPCMethodNames.updateFiles]: UpdateFileParam[];
    [RPCMethodNames.getFiles]: number[];
    [RPCMethodNames.queryFiles]: QueryParam<IFileInfo, IFileFilter>;
    // other
    [RPCMethodNames.isRelease]: void;
}

export interface RPCMethodsResult extends Record<RPCMethodNames, unknown> {
    // Modules
    [RPCMethodNames.getModules]: ModulesRecord<ITransferModule>;
    [RPCMethodNames.getUpdates]: number[];
    [RPCMethodNames.hasUpdates]: boolean[];
    // Items
    [RPCMethodNames.queryItems]: QueryResult<number>;
    [RPCMethodNames.getItems]: ITransferItem[];
    [RPCMethodNames.updateItem]: boolean;
    [RPCMethodNames.updateItems]: boolean[];
    // File
    [RPCMethodNames.setSize]: boolean;
    [RPCMethodNames.updateFile]: boolean;
    [RPCMethodNames.updateFiles]: boolean[];
    [RPCMethodNames.getStacks]: Record<number, Stack>;
    [RPCMethodNames.getFiles]: ITransportFile[];
    [RPCMethodNames.queryFiles]: QueryResult<number>;
    // other
    [RPCMethodNames.isRelease]: boolean;
}
