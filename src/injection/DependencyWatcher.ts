import { Define } from './_dependencyWatcher/Define';
import { Require } from './_dependencyWatcher/Require'
import { DEFINE, REQUIRE } from "./_dependencyWatcher/const";
import { IPlugin, IPluginConfig } from "./IPlugin";
import { IEventEmitter } from "Extension/Event/IEventEmitter";
import { RPC } from "Extension/Event/RPC";
import { EventNames, PLUGIN_NAME } from "Extension/Plugins/DependencyWatcher/const";
import { GLOBAL } from "./const";
import { ModuleStorage } from './_dependencyWatcher/storage/Module';
import debounce from "Extension/Utils/debounce";
import { INamedLogger } from "Extension/Logger/ILogger";
import { RPCResponse} from "./_dependencyWatcher/RPCResponse";
import { FileStorage } from "./_dependencyWatcher/storage/File";
import { IDescriptor } from "./_dependencyWatcher/IDescriptor";

const SEC = 1000;

export class DependencyWatcher implements IPlugin {
    private readonly __channel: IEventEmitter;
    private readonly __logger: INamedLogger;
    private __rpc: RPCResponse;
    private readonly __storage: ModuleStorage;
    constructor({ channel, logger }: IPluginConfig) {
        this.__channel = channel;
        this.__logger = logger;
        this.__storage = this.__createStorage();
        
        let require = new Require({
            moduleStorage: this.__storage,
            logger: this.__logger.create('require')
        });
        let define = new Define({
            moduleStorage: this.__storage,
            logger: this.__logger.create('define')
        });
    
        this.__rpc = new RPCResponse({
            rpc: new RPC({ channel: this.__channel }),
            require,
            logger,
            fileStorage: new FileStorage(),
            moduleStorage: this.__storage
        });
        
        this.__defineProperty(require, REQUIRE).catch(() => {
            try {
                const defined = { ...GLOBAL[REQUIRE].s.contexts._.defined };
                this.__logger.log(`Не удалось вовремя переопределить require, возможны проблемы с модулями: ${ Object.keys(defined).toString() }`)
            } catch (error) {
                this.__logger.error(error);
            }
        });
        this.__defineProperty(define, DEFINE).catch(() => {
            // ignore
        });
    }

    private __createStorage(): ModuleStorage {
        return new ModuleStorage(debounce(() => {
            this.__channel.dispatch(EventNames.update, {});
        }, SEC));
    }
    private __defineProperty(desc: IDescriptor, name: string): Promise<void> {
        const descriptor = desc.getDescriptor();
        return new Promise<void>((resolve, reject) => {
            try {
                Object.defineProperties(GLOBAL, {
                    [name]: descriptor,
                });
                resolve();
            } catch (e) {
                reject(e);
            }
        }).catch<void>((error: Error) => {
            // @ts-ignore
            descriptor.set(GLOBAL[name]);
            // @ts-ignore
            GLOBAL[name] = descriptor.get();
            this.__channel.dispatch('error', error.message);
            // this.__logger.error(error);
            throw error;
        });
    }

    static getName() {
        return PLUGIN_NAME
    }
}
