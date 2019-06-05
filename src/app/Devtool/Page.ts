import * as Control from 'Core/Control';
import * as template from 'wml!Devtool/Page/Page';
import { Memory } from 'Types/source';
import { ContentChannel } from 'Devtool/Event/ContentChannel';
import { GlobalMessages } from 'Extension/const';
import 'css!Devtool/Page/Page';

// TODO: пока не подключили application берём шрифты отсюда
import 'css!Controls/Application/Application';

class Extension extends Control {
   protected _template: Function = template;
   protected _activeTab: string = 'Elements';
   protected _tabsSource: Memory = new Memory({
      idProperty: '',
      data: [
         {
            id: 'Dependencies',
            title: 'Dependencies'
         },
         {
            id: 'Elements',
            title: 'Elements'
         }
      ]
   });
   protected _channel: ContentChannel = new ContentChannel('globalChannel');
   protected _hasWasabyOnPage: boolean = false;
   constructor() {
      super();
      this._channel.dispatch(GlobalMessages.devtoolsInitialized);
      this._channel.addListener(GlobalMessages.wasabyInitialized, () => {
         this._hasWasabyOnPage = true;
      });
      chrome.devtools.network.onNavigated.addListener(() => {
         this._hasWasabyOnPage = false;
      });
   }
}

export default Extension;
