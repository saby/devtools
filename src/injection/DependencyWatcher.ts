import { define } from './_dependencyWatcher/define';
import { require } from './_dependencyWatcher/require'
import { DEFINE, REQUIRE } from "./_dependencyWatcher/const";
import { IPlugin, IPluginConfig } from "./IPlugin";
import { IEventEmitter } from "Extension/Event/IEventEmitter";
import { RPC } from "Extension/Event/RPC";
import { getBundles } from "./_dependencyWatcher/RPC/getBundles";
import { EventNames, PLUGIN_NAME, RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { getModules } from "./_dependencyWatcher/RPC/getModules";
import { getModulesList } from "./_dependencyWatcher/RPC/getModulesList";
import { GLOBAL } from "./const";
import { hasNewModules } from "./_dependencyWatcher/RPC/hasNewModules";
import { moduleStorage, UpdateType } from './_dependencyWatcher/moduleStorage';
import debounce from "Extension/Utils/debounce";

const SEC = 1000;

export class DependencyWatcher implements IPlugin {
    private readonly __channel: IEventEmitter;
    private __rpc: RPC;
    constructor({ devtoolChannel }: IPluginConfig) {
        this.__channel = devtoolChannel;
        this.__createRPC();
        this.__defineProperty();
        this.__notifyUpdate();
    }

    private __createRPC () {
        this.__rpc = new RPC({ channel: this.__channel });
        this.__rpc.registerMethod(RPCMethods.getBundles, getBundles);
        this.__rpc.registerMethod(RPCMethods.getModules, getModules);
        this.__rpc.registerMethod(RPCMethods.getModulesList, getModulesList);
        this.__rpc.registerMethod(RPCMethods.hasNewModules, hasNewModules);
    }
    private __defineProperty() {
        let config = {
            watchDynamicDependency: true
        };
        try {
            Object.defineProperties(GLOBAL, {
                [DEFINE]: define(config),
                [REQUIRE]: require(config)
            });
        } catch (error) {
            this.__channel.dispatch('error', error.message);
        }
    }
    private __notifyUpdate() {
        moduleStorage.onupdate = debounce(() => {
            this.__channel.dispatch(EventNames.update, {});
        }, SEC);
    }

    static getName() {
        return PLUGIN_NAME
    }
}
