import { DependencyWatcher } from './DependencyWatcher';
import { IPluginConstructor, IPlugin } from './IPlugin';
import { InjectHook } from './InjectHook';
import { DevtoolChannel } from './_devtool/Channel';
import { GlobalMessages } from 'Extension/const';
import { globalChannel } from './_devtool/globalChannel';
import { ConsoleLogger } from 'Extension/Logger/Console';

const ALL_PLUGINS: IPluginConstructor[] = [
    DependencyWatcher,
    InjectHook
];

const logger = new ConsoleLogger('Wasaby devtool');
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
   if (document.readyState === 'complete') {
      globalChannel.addListener(GlobalMessages.devtoolsInitialized, () => {
         logger.log('Обнаружили оживление вкладки wasaby, сообщаем о том что страница живая');
         globalChannel.dispatch(GlobalMessages.wasabyInitialized);
      });
      globalChannel.dispatch(GlobalMessages.wasabyInitialized);
      logger.log('Страница построена, сообщаем о том что страница живая');
      document.removeEventListener('readystatechange', onDocumentLoad);
   }
}

if (document.readyState !== 'complete') {
   document.addEventListener('readystatechange', onDocumentLoad);
} else {
   onDocumentLoad();
}
