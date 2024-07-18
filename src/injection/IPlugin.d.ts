import { IEventEmitter } from 'Extension/Event/IEventEmitter';
import { INamedLogger } from 'Extension/Logger/ILogger';

// tslint:disable-next-line:no-empty-interface
export interface IPlugin {
}

export interface IPluginConfig<TParams = void> {
   channel: IEventEmitter;
   logger: INamedLogger;
}

export interface IPluginConstructor {
   new (config: IPluginConfig): IPlugin;
   getName(): string;
}
