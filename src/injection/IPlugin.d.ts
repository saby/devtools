export interface IPlugin {
    // update(config)
}

export interface IPluginConstructor {
    new(...args): IPlugin;
    getName(): string;
}
