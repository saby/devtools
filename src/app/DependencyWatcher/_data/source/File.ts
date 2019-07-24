import { DataSet, Query as TypesQuery } from 'Types/source';
import { ITransportFile } from "Extension/Plugins/DependencyWatcher/IFile";
import { getQueryParam } from "./list/getQueryParam";
import { IItemInfo } from "Extension/Plugins/DependencyWatcher/IItem";
import { File as FileStorage, getFileStorage } from "../storage/File";
import { ILogger } from "Extension/Logger/ILogger";
import { Compatibility, ICompatibilityConfig } from "./Compatibility";

export interface IFileConfig extends ICompatibilityConfig {
    // fileStorage: FileStorage;
    logger: ILogger;
}
export class File extends Compatibility {
    private __files: FileStorage;
    private __logger: ILogger;
    constructor(config: IFileConfig) {
        super(config);
        this.__files = getFileStorage();
        this.__logger = config.logger;
    }
    query(query: TypesQuery): Promise<DataSet> {
        this.__logger.log('start query');
        const queryParam = getQueryParam<IItemInfo>(
            query,
            undefined
        );
        return this.__files.query(queryParam).then(({ data, hasMore }) => {
            this.__logger.log(`query success`);
            this.__logger.log(`get items`);
            return this.__files.getItems(data).then((files: ITransportFile[]) => {
                this.__logger.log(`get items - success`);
                return new DataSet({
                    rawData: {
                        data: files,
                        meta: {
                            more: hasMore
                        }
                    },
                    itemsProperty: 'data',
                    metaProperty: 'meta'
                });
            });
        }).catch((error: Error) => {
            this.__logger.error(error);
            throw error;
        });
    }
}
