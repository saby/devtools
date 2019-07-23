import { Memory, DataSet, Query } from 'Types/source';

import { RPC } from "Extension/Event/RPC";
// import { RPCMethods } from "../RPCMethods";
import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";
import { register } from "Types/di";

export interface ISourceConfig {
    rpc: RPC
}

export class File extends Memory {
    // private _rpc: RPCMethods;
    constructor(config: ISourceConfig) {
        // @ts-ignore
        super(config);
        // this._rpc = new RPCMethods(config.rpc);
    }
    // @ts-ignore
    query(query: Query): Promise<DataSet> {
        /*return this._rpc.getFiles().then((files: Map<number, IFile>) => {
            this._$data = Array.from(files, ([id, file]) => {
                return file;
            });
            return super.query(query);
        });*/
    }
}

Object.assign(File.prototype, {
    '[DependencyWatcher/_data/source/File]': true,
    _moduleName: 'DependencyWatcher/data:source.File'
});

register('DependencyWatcher/data:source.File', File, {instantiate: false});
