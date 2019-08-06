// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!Devtool/Page/Page';
import { Memory } from 'Types/source';
import { ContentChannel } from 'Devtool/Event/ContentChannel';
import { GlobalMessages } from 'Extension/const';
import 'css!Devtool/Page/Page';

// TODO: пока не подключили application берём шрифты отсюда
import 'css!Controls/Application/Application';
import { ConsoleLogger } from "Extension/Logger/Console";
import Store from 'Elements/Store';

let logger = new ConsoleLogger('Wasaby');
logger.log('main component loaded');
class Extension extends Control {
   protected _template: Function = template;
   protected _activeTab: string = 'Dependencies';
   protected _tabsSource: Memory = new Memory({
      idProperty: '',
      data: [
         {
            id: 'Dependencies',
            title: 'Dependencies',
            align: 'left'
         },
         {
            id: 'Elements',
            title: 'Elements',
            align: 'left'
         },
         {
            id: 'Profiler',
            title: 'Profiler',
            align: 'left'
         }
      ]
   });
   protected _channel: ContentChannel = new ContentChannel('globalChannel');
   protected _hasWasabyOnPage: boolean = false;
   protected _store: Store;
   constructor() {
      super();
      logger.log('сообщаем странице об активности вкладки');
      this._channel.dispatch(GlobalMessages.devtoolsInitialized);
      this._channel.addListener(GlobalMessages.wasabyInitialized, () => {
         logger.log('получили ответ от вкладки, скрываем оверлей');
         this._store = new Store();
         this._hasWasabyOnPage = true;
      });
      chrome.devtools.network.onNavigated.addListener(() => {
         logger.log('получили нативное событие смены адреса страницы, показываем оверлей');
         this._hasWasabyOnPage = false;
         this._store.destructor();
      });
   }

   private __openOptionsPage(): void {
      chrome.runtime.openOptionsPage();
   }
}

export default Extension;
