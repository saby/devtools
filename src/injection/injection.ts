import { DependencyWatcher } from './DependencyWatcher';
import { GLOBAL } from "./RENAME/const";
import { IPluginConstructor, IPlugin } from './IPlugin';

const ALL_PLUGINS: Array<IPluginConstructor> = [ DependencyWatcher ];
const PLUGIN_CONFIGS = GLOBAL.wasabyDevtoolConfig || {};

const PLUGINS: Map<string, IPlugin> = new Map;

ALL_PLUGINS.forEach((Plugin: IPluginConstructor) => {
    let name = Plugin.getName();
    let config = PLUGIN_CONFIGS[name] || {};
    let plugin = new Plugin(config);
    PLUGINS.set(name, plugin);
});
