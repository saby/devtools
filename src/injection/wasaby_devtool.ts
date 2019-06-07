import { DependencyWatcher } from './DependencyWatcher';
import { IPluginConstructor, IPlugin } from './IPlugin';
import { InjectHook } from './InjectHook';
import { DevtoolChannel } from './_devtool/Channel';
import { GlobalMessages } from 'Extension/const';
import { globalChannel } from './_devtool/globalChannel';
import { logger } from './_devtool/logger';

const ALL_PLUGINS: IPluginConstructor[] = [ DependencyWatcher, InjectHook ];

const PLUGINS: Map<string, IPlugin> = new Map();

ALL_PLUGINS.forEach((Plugin: IPluginConstructor) => {
    const name = Plugin.getName();
    const plugin = new Plugin({
        channel: new DevtoolChannel(name),
        logger: logger.create(name),
        plugins: PLUGINS
    });
    PLUGINS.set(name, plugin);
});

function onDocumentLoad(): void {
   globalChannel.addListener(GlobalMessages.devtoolsInitialized, () => {
      globalChannel.dispatch(GlobalMessages.wasabyInitialized);
   });
   globalChannel.dispatch(GlobalMessages.wasabyInitialized);
   document.removeEventListener('DOMContentLoaded', onDocumentLoad);
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
