import * as Control from 'Core/Control';
import * as template from 'wml!Extension/Devtool';
import { Memory } from 'Types/source';
import { IControlNode } from '../../extension/const';

const port = chrome.runtime.connect({
   name: '' + chrome.devtools.inspectedWindow.tabId
});

class Extension extends Control {
   protected _template: Function = template;
   protected _activeTab: string = 'Elements';
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
   protected _nodes: IControlNode[] = [];

   protected _beforeMount(): Promise<undefined> {
      return new Promise((resolve) => {
         requirejs(['Controls/List/Mover'], (Mover: Function) => {
            this._nodes = [{
               id: 1,
               name: 'Controls/List/Mover',
               type: Mover,
               options: {
                  string: 'test',
                  number: 45674958,
                  object: {
                     objField: 1231,
                     anotherOne: 1,
                     andAnotherOne: {
                        andOneMore: '4534'
                     },
                     array: [1, '2', {
                        andOneMore: '4534'
                     }]
                  },
                  func: () => 1
               }
            }];
            resolve();
         });
      });
   }

   static _getInheritOptions(): object {
      return {
         port
      };
   }
}

export default Extension;
