import { DependencyWatcher } from './DependencyWatcher';
import { IPluginConstructor, IPlugin } from './IPlugin';
import { InjectHook } from './InjectHook';
import { DevtoolChannel } from './_devtool/Channel';
import { Focus } from './Focus';
import { GlobalMessages } from 'Extension/const';
import { getGlobalChannel } from './_devtool/globalChannel';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { ExtenstionTabName } from 'Extension/Utils/loadOptions';

const selectedTabs = window.wasabyDevtoolsOptions.tabs;

const pluginsForTabs: Set<IPluginConstructor> = new Set([InjectHook]);

selectedTabs.forEach((tabName: ExtenstionTabName) => {
   switch (tabName) {
      case 'Elements':
         pluginsForTabs.add(InjectHook);
         break;
      case 'Profiler':
         pluginsForTabs.add(InjectHook);
         break;
      case 'Dependencies':
         pluginsForTabs.add(DependencyWatcher);
         break;
      case 'Debugging':
         break;
      case 'Focus':
         pluginsForTabs.add(Focus);
         break;
   }
});

const logger = new ConsoleLogger('Wasaby devtool');
const PLUGINS: Map<string, IPlugin> = new Map();

pluginsForTabs.forEach((Plugin) => {
   const name = Plugin.getName();
   const plugin = new Plugin({
      channel: new DevtoolChannel(name),
      logger: logger.create(name)
   });
   PLUGINS.set(name, plugin);
});

function onDocumentLoad(): void {
   if (document.readyState === 'complete') {
      getGlobalChannel().addListener(GlobalMessages.devtoolsInitialized, () => {
         logger.log(
            'Обнаружили оживление вкладки wasaby, сообщаем о том что страница живая'
         );
         getGlobalChannel().dispatch(GlobalMessages.wasabyInitialized);
      });
      getGlobalChannel().dispatch(GlobalMessages.wasabyInitialized);
      logger.log('Страница построена, сообщаем о том что страница живая');
      document.removeEventListener('readystatechange', onDocumentLoad);
   }
}

if (document.readyState !== 'complete') {
   document.addEventListener('readystatechange', onDocumentLoad);
} else {
   onDocumentLoad();
}
