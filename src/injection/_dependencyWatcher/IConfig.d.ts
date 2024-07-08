import { ModuleStorage } from './storage/Module';
import { INamedLogger } from 'Extension/Logger/ILogger';

/**
 * Interface for options of require and define wrappers.
 * @author Зайцев А.С.
 */
export interface IConfigWithStorage {
   logger: INamedLogger;
   moduleStorage: ModuleStorage;
}
