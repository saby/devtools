import { IRequire, IRequireInitObject } from "./require/IRequire";
import { proxyRequire } from "./require/proxy";
import { ModuleStorage } from "./storage/Module";
import { ILogger } from "Extension/Logger/ILogger";
import { IDescriptor } from "./IDescriptor";
import { IConfigWithStorage } from "./IConfig";

export class Require implements IDescriptor {
    constructor({ logger, moduleStorage }: IConfigWithStorage) {
        this.__storage = moduleStorage;
        this.__logger = logger;
    }
    private __require: IRequire;
    private __init: IRequireInitObject;
    private __proxy: IRequire;
    private __storage: ModuleStorage;
    private __logger: ILogger;
    getDescriptor(): PropertyDescriptor {
        let _this = this;
        let storage = this.__storage;
        let logger = this.__logger;
        return  {
            set(value: IRequire | IRequireInitObject) {
                if (typeof value === 'function') {
                    _this.__require = <IRequire> value;
                    _this.__proxy = proxyRequire(_this.__require, storage, logger);
                } else {
                    _this.__init = value;
                }
            },
            get(): IRequire | IRequireInitObject | void {
                return _this.__proxy || _this.__init;
            }
        }
    };
    getOrigin(): IRequire {
        return  this.__require;
    }
    getConfig<T extends IRequireInitObject>(): T {
        if (this.__require) {
            try {
                // @ts-ignore
                return this.__require.s.contexts._.config;
            }
            catch (error) {
                this.__logger.warn(error);
            }
        }
        // @ts-ignore
        return this.__init;
    }
}
