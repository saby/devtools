import { DataSet, Query as TypesQuery } from 'Types/source';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { getQueryParam } from './list/getQueryParam';
import { IRPCModuleInfo } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { File as FileStorage } from '../storage/File';
import { ILogger } from 'Extension/Logger/ILogger';
import { Compatibility, ICompatibilityConfig } from './Compatibility';
import { Lang, revert } from 'Extension/Utils/kbLayout';

export interface IFileConfig extends ICompatibilityConfig {
   fileStorage: FileStorage;
   logger: ILogger;
}

/**
 * File source on the frontend.
 * @author Зайцев А.С.
 */
export class File extends Compatibility {
   private _files: FileStorage;
   private _logger: ILogger;
   constructor(config: IFileConfig) {
      super(config);
      this._files = config.fileStorage;
      this._logger = config.logger;
   }
   query(query: TypesQuery): Promise<DataSet> {
      this._logger.log('start query');
      const queryParam = getQueryParam<IRPCModuleInfo>(query);
      let switchedStr: string | undefined;
      return this._files
         .query(queryParam)
         .then(({ data, hasMore }) => {
            // Если есть результат или строка поиска пустая, возвращаем как есть
            if (data.length || !queryParam.where.name) {
               return { data, hasMore };
            }
            switchedStr = revert(queryParam.where.name, Lang.ru, Lang.en);
            // если ничего не поменялось, то тоже возвращаем как есть
            if (switchedStr === queryParam.where.name) {
               switchedStr = undefined;
               return { data, hasMore };
            }
            queryParam.where.name = switchedStr;
            return this._files.query(queryParam);
         })
         .then(({ data, hasMore }) => {
            this._logger.log('query success');
            this._logger.log('get items');
            return this._files
               .getItems(data)
               .then((files: ITransportFile[]) => {
                  this._logger.log('get items - success');
                  return new DataSet({
                     rawData: {
                        data: files.map((f) => {
                           return {
                              ...f,
                              title: f.name
                           };
                        }),
                        meta: {
                           more: hasMore,
                           switchedStr
                        }
                     },
                     itemsProperty: 'data',
                     metaProperty: 'meta',
                     keyProperty: 'id'
                  });
               });
         })
         .catch((error: Error) => {
            this._logger.error(error);
            throw error;
         });
   }
}
