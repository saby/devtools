import {
   IQueryParam,
   IQueryResult
} from 'Extension/Plugins/DependencyWatcher/data/IQuery';
import { RPCMethodNames } from 'Extension/Plugins/DependencyWatcher/const';
import { RPC } from 'Extension/Event/RPC';
import {
   IFileFilter,
   ITransportFile
} from 'Extension/Plugins/DependencyWatcher/IFile';

interface IFileQueryResult extends IQueryResult<number> {}
interface IFileQueryParam
   extends Partial<IQueryParam<ITransportFile, IFileFilter>> {}

/**
 * File storage on the frontend.
 * @author Зайцев А.С.
 */
export class File {
   private _files: Map<number, ITransportFile> = new Map();
   constructor(private _rpc: RPC) {}
   query(queryParams: IFileQueryParam = {}): Promise<IFileQueryResult> {
      return this._rpc.execute<IFileQueryResult, IFileQueryParam>({
         methodName: RPCMethodNames.fileQuery,
         args: queryParams
      });
   }
   getItems(keys: number[]): Promise<ITransportFile[]> {
      return this.__updateCache(keys).then(() => {
         return keys.map((id: number) => {
            return this._files.get(id) as ITransportFile;
         });
      });
   }
   private __updateCache(keys: number[]): Promise<void> {
      if (!keys.length) {
         return Promise.resolve();
      }
      const needKeys = keys.filter((key) => {
         return !this._files.has(key);
      });
      return this._rpc
         .execute<ITransportFile[], number[]>({
            methodName: RPCMethodNames.fileGetItems,
            args: needKeys
         })
         .then((items: ITransportFile[]) => {
            items.forEach((item: ITransportFile) => {
               this._files.set(item.id, item);
            });
         });
   }
}
