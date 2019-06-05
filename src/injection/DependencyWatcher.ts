import { Define } from './_dependencyWatcher/Define';
import { Require } from './_dependencyWatcher/Require'
import { DEFINE, REQUIRE } from "./_dependencyWatcher/const";
import { IPlugin, IPluginConfig } from "./IPlugin";
import { IEventEmitter } from "Extension/Event/IEventEmitter";
import { RPC } from "Extension/Event/RPC";
import { EventNames, PLUGIN_NAME } from "Extension/Plugins/DependencyWatcher/const";
import { GLOBAL } from "./const";
import { ModuleStorage } from './_dependencyWatcher/ModuleStorage';
import debounce from "Extension/Utils/debounce";
import { INamedLogger } from "Extension/Logger/ILogger";
import { RPCResponse} from "./_dependencyWatcher/RPCResponse";

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
            moduleStorage: this.__storage
        });
        
        this.__defineProperty(require, define);
    }

    private __createStorage(): ModuleStorage {
        return new ModuleStorage(debounce(() => {
            this.__channel.dispatch(EventNames.update, {});
        }, SEC));
    }
    private __defineProperty(require: Require, define: Define) {
        try {
            Object.defineProperties(GLOBAL, {
                [DEFINE]: define.getDescriptor(),
                [REQUIRE]: require.getDescriptor()
            });
        } catch (error) {
            this.__channel.dispatch('error', error.message);
            this.__logger.error(error);
        }
    }

    static getName() {
        return PLUGIN_NAME
    }
}
