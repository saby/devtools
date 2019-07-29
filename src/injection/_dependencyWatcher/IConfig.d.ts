import { ModuleStorage } from "./storage/Module";
import { INamedLogger } from "Extension/Logger/ILogger";

export interface IConfig {
    logger: INamedLogger;
}

export interface IConfigWithStorage extends IConfig {
    moduleStorage: ModuleStorage;
}
