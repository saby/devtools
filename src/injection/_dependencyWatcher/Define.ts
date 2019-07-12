import { IConfigWithStorage } from "./IConfig";
import { IDefine } from "./define/IDefine";
import { IDescriptor } from "./IDescriptor";
import { ModuleStorage } from "./storage/Module";
import { ILogger } from "Extension/Logger/ILogger";
import { proxyDefine } from "./define/proxy";

export class Define implements IDescriptor {
    constructor({ logger, moduleStorage }: IConfigWithStorage) {
        this.__storage = moduleStorage;
        this.__logger = logger;
    }
    private __storage: ModuleStorage;
    private __logger: ILogger;
    private __define: IDefine;
    private __proxy: IDefine;
    getDescriptor(): PropertyDescriptor {
        let _this = this;
        return {
            set(value: IDefine) {
                _this.__define = value;
                _this.__proxy = proxyDefine(_this.__define, _this.__storage, _this.__logger);
            },
            get(): IDefine | void {
                return _this.__proxy;
            }
        }
    }
}
