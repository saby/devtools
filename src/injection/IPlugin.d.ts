import { IEventEmitter } from "Extension/Event/IEventEmitter";
import { INamedLogger } from "Extension/Logger/ILogger";

export interface IPlugin {
    // update(config)
}

export interface IPluginConfig<TParams = void> {
    channel: IEventEmitter;
    logger: INamedLogger;
    plugins: Map<string, IPlugin>;
}

export interface IPluginConstructor {
    new(config: IPluginConfig): IPlugin;
    getName(): string;
}
