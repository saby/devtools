import { QueryParam, QueryResult } from "Extension/Plugins/DependencyWatcher/data/IQuery";
import { RPCMethodNames } from "Extension/Plugins/DependencyWatcher/const";
import { RPC } from "Extension/Event/RPC";
import { IFileFilter, ITransportFile } from "Extension/Plugins/DependencyWatcher/IFile";

interface FileQueryResult extends QueryResult<number> {

}
interface FileQueryParam extends Partial<QueryParam<ITransportFile, IFileFilter>> {

}

export class File {
    private __files: Map<number, ITransportFile> = new Map();
    constructor(private _rpc: RPC) {}
    query(queryParams: FileQueryParam = {}): Promise<FileQueryResult> {
        return this._rpc.execute<FileQueryResult, FileQueryParam>({
            methodName: RPCMethodNames.fileQuery,
            args: queryParams
        });
    }
    getItems(keys: number[]): Promise<ITransportFile[]> {
        return this.__updateCache(keys).then(() => {
            return keys.map((id: number) => {
                return <ITransportFile> this.__files.get(id);
            });
        })
    }
    private __updateCache(keys: number[]): Promise<void> {
        if (!keys.length) {
            return Promise.resolve();
        }
        const needKeys = keys.filter((key) => {
            return !this.__files.has(key);
        });
        return this._rpc.execute<ITransportFile[], number[]>({
            methodName: RPCMethodNames.fileGetItems,
            args: needKeys
        }).then((items: ITransportFile[]) => {
            items.forEach((item: ITransportFile) => {
                this.__files.set(item.id, item);
            });
        });
    }
    
}
