import Control = require('Core/Control');
import template = require('wml!Extension/Extension');
import { Memory } from 'Types/source';

class Extension extends Control {
   protected _template: Function = template;
   protected _tabsSource: Memory = new Memory({
      idProperty: '',
      data: [{
         id: 'Elements',
         title: 'Elements'
      }, {
         id: 'Dependencies',
         title: 'Dependencies'
      }]
   });
}

export default Extension;
