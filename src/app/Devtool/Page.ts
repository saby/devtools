import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!Devtool/Page/Page');
import { Memory } from 'Types/source';
import { ContentChannel } from 'Devtool/Event/ContentChannel';
import { GlobalMessages } from 'Extension/const';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { Store } from 'Elements/elements';

const logger = new ConsoleLogger('Wasaby');
logger.log('main component loaded');
class Extension extends Control {
   protected _template: TemplateFunction = template;
   protected _activeTab: string = 'Elements';
   protected _tabsSource: Memory = new Memory({
      keyProperty: 'id',
      data: [
         {
            id: 'Elements',
            title: 'Elements',
            align: 'left'
         },
         {
            id: 'Profiler',
            title: 'Profiler',
            align: 'left'
         },
         {
            id: 'Dependencies',
            title: 'Dependencies',
            align: 'left'
         },
         {
            id: 'Debugging',
            title: 'Debugging',
            align: 'left'
         }
      ]
   });
   protected _channel: ContentChannel = new ContentChannel('globalChannel');
   protected _hasWasabyOnPage: boolean = false;
   protected _store?: Store;
   protected _tabChanged: boolean = false;
   protected _rootKey: number = 0;
   constructor(options: IControlOptions) {
      super(options);
      logger.log('сообщаем странице об активности вкладки');
      this._channel.dispatch(GlobalMessages.devtoolsInitialized);
      this._channel.addListener(GlobalMessages.wasabyInitialized, () => {
         logger.log('получили ответ от вкладки');
         this._hasWasabyOnPage = true;
         this._initState();
      });
      chrome.devtools.network.onNavigated.addListener(() => {
         logger.log('получили нативное событие смены адреса страницы');
         this._hasWasabyOnPage = false;
         if (this._store) {
            this._store.destructor();
            this._store = undefined;
         }
         this._tabChanged = true;
      });
   }

   protected _beforeUpdate(): void {
      if (this._tabChanged) {
         logger.log('показываем оверлей');
         this._tabChanged = false;
         this._rootKey++;
         this._initState();
      }
   }

   protected _initState(): void {
      if (!this._tabChanged && this._hasWasabyOnPage) {
         logger.log('скрываем оверлей');
         this._store = new Store();
      }
   }

   protected _openOptionsPage(): void {
      chrome.runtime.openOptionsPage();
   }

   static _theme: string[] = [
      'Devtool/Page/Page',
      'Controls/Application/Application',
      'Controls/Application/oldCss' // TODO: пока не подключили application берём шрифты отсюда
   ];
}

export default Extension;
