import * as Control from 'Core/Control';
import * as template from 'wml!Devtool/Page/Page';
import { Memory } from 'Types/source';

class Extension extends Control {
   protected _template: Function = template;
   protected _activeTab: string = 'Elements';
   protected _tabsSource: Memory = new Memory({
      idProperty: '',
      data: [
         {
            id: 'Elements',
            title: 'Elements'
         },
         {
            id: 'Dependencies',
            title: 'Dependencies'
         }
      ]
   });
}

export default Extension;
