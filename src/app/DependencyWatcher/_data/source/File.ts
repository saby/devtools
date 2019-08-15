import { DataSet, Query as TypesQuery } from 'Types/source';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { getQueryParam } from './list/getQueryParam';
import { IItemInfo } from 'Extension/Plugins/DependencyWatcher/IItem';
import { File as FileStorage } from '../storage/File';
import { ILogger } from 'Extension/Logger/ILogger';
import { Compatibility, ICompatibilityConfig } from './Compatibility';
import { Lang, revert } from 'Extension/Utils/kbLayout';

export interface IFileConfig extends ICompatibilityConfig {
    fileStorage: FileStorage;
    logger: ILogger;
}

export class File extends Compatibility {
    private __files: FileStorage;
    private __logger: ILogger;
    constructor(config: IFileConfig) {
        super(config);
        this.__files = config.fileStorage;
        this.__logger = config.logger;
    }
    query(query: TypesQuery): Promise<DataSet> {
        this.__logger.log('start query');
        const queryParam = getQueryParam<IItemInfo>(
            query,
            undefined
        );
        let switchedStr: string | undefined;
        return this.__files.query(queryParam).then(({ data, hasMore }) => {
            // Если есть результат или строка поиска пустая, возвращаем как есть
            if (data.length || !queryParam.where.name) {
                return { data, hasMore };
            }
            switchedStr = revert(queryParam.where.name, Lang.ru, Lang.en);
            // если ничего не поменялось, то тоже возвращаем как есть
            if (switchedStr == queryParam.where.name) {
                switchedStr = undefined;
                return { data, hasMore };
            }
            queryParam.where.name = switchedStr;
            return this.__files.query(queryParam);
        }).then(({ data, hasMore }) => {
            this.__logger.log(`query success`);
            this.__logger.log(`get items`);
            return this.__files.getItems(data).then((files: ITransportFile[]) => {
                this.__logger.log(`get items - success`);
                return new DataSet({
                    rawData: {
                        data: files.map((f) => {
                            return {
                                ...f,
                                title: f.name
                            }
                        }),
                        meta: {
                            more: hasMore,
                            switchedStr
                        }
                    },
                    itemsProperty: 'data',
                    metaProperty: 'meta',
                    //@ts-ignore
                    idProperty: 'id'
                });
            });
        }).catch((error: Error) => {
            this.__logger.error(error);
            throw error;
        });
    }
}
