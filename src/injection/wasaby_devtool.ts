import { DependencyWatcher } from './DependencyWatcher';
import { IPluginConstructor, IPlugin } from './IPlugin';
import { InjectHook } from './InjectHook';
import { DevtoolChannel } from "./_devtool/Channel";
import { GlobalMessages } from "Extension/const";
import { globalChannel } from "./globalChannel";

const ALL_PLUGINS: Array<IPluginConstructor> = [ DependencyWatcher, InjectHook ];

const PLUGINS: Map<string, IPlugin> = new Map;

ALL_PLUGINS.forEach((Plugin: IPluginConstructor) => {
    let name = Plugin.getName();
    let plugin = new Plugin({
        devtoolChannel: new DevtoolChannel(name)
    });
    PLUGINS.set(name, plugin);
});

globalChannel.addListener(GlobalMessages.devtoolsInitialized, () => {
    globalChannel.dispatch(GlobalMessages.wasabyInitialized);
});
globalChannel.dispatch(GlobalMessages.wasabyInitialized);
