import { IEventEmitter } from "Extension/Event/IEventEmitter";

export interface IPlugin {
    // update(config)
}

export interface IPluginConfig<TParams = void> {
    devtoolChannel: IEventEmitter;
}

export interface IPluginConstructor {
    new(config: IPluginConfig): IPlugin;
    getName(): string;
}
