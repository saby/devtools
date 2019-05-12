import { define } from './_dependencyWatcher/define';
import { require } from './_dependencyWatcher/require'
import { DEFINE, REQUIRE } from "./_dependencyWatcher/const";
import { IPlugin, IPluginConfig } from "./IPlugin";
import { IEventEmitter } from "Extension/Event/IEventEmitter";
import { RPC } from "Extension/Event/RPC";
import { getBundles } from "./_dependencyWatcher/RPC/getBundles";
import { PLUGIN_NAME, RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { getModules } from "./_dependencyWatcher/RPC/getModules";
import { getModulesList } from "./_dependencyWatcher/RPC/getModulesList";
import { GLOBAL } from "./const";
import { hasNewModules } from "./_dependencyWatcher/RPC/hasNewModules";

export class DependencyWatcher implements IPlugin {
    private __channel: IEventEmitter;
    private __rpc: RPC;
    constructor({ devtoolChannel }: IPluginConfig) {
        this.__channel = devtoolChannel;
        this.__createRPC();
        this.__defineProperty();
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

    static getName() {
        return PLUGIN_NAME
    }
}
