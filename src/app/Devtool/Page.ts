import * as Control from 'Core/Control';
import * as template from 'wml!Devtool/Page/Page';
import { Memory } from 'Types/source';
import 'css!Devtool/Page/Page';

//TODO: пока не подключили application берём шрифты отсюда
import 'css!Controls/Application/Application';

class Extension extends Control {
   protected _template: Function = template;
   protected _activeTab: string = 'Dependencies';
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
}

export default Extension;
